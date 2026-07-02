import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from './FirebaseProvider';
import { collection, addDoc } from 'firebase/firestore';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'Celular';
  }
  return 'Computador';
};

const getBrowserType = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Browser';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Trident')) return 'Internet Explorer';
  if (ua.includes('Edge') || ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Outros';
};

export const AnalyticsTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const trackPageview = async () => {
      try {
        const path = location.pathname;
        const search = location.search;
        
        // Skip tracking of editing mode or admin panel to avoid skewing real user traffic
        if (search.includes('edit=true') || path.startsWith('/admin')) {
          return;
        }

        // Check if we already tracked this page in the current session
        const sessionKey = `ino_track_${path}`;
        if (sessionStorage.getItem(sessionKey)) {
          return;
        }

        // Extract event ID from the path if it exists
        // Supported patterns: /invite/:id, /client-dashboard/:id, /checkin/:id
        let eventId = '';
        const inviteMatch = path.match(/^\/invite\/([^/]+)/);
        const clientDashMatch = path.match(/^\/client-dashboard\/([^/]+)/);
        const checkinMatch = path.match(/^\/checkin\/([^/]+)/);

        if (inviteMatch) {
          eventId = inviteMatch[1];
        } else if (clientDashMatch) {
          eventId = clientDashMatch[1];
        } else if (checkinMatch) {
          eventId = checkinMatch[1];
        }

        const device = getDeviceType();
        const browser = getBrowserType();
        const referrer = document.referrer ? new URL(document.referrer).hostname : 'Direto';

        // Add visit record to Firestore
        await addDoc(collection(db, 'visits'), {
          path,
          eventId: eventId || null,
          device,
          browser,
          referrer,
          timestamp: new Date().toISOString()
        });

        // Send page view to Google Analytics (gtag.js)
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('config', 'G-8P6CGLFLLJ', {
            page_path: path + search,
            page_title: document.title
          });
        }

        // Set session storage to prevent double tracking during this session
        sessionStorage.setItem(sessionKey, 'true');
      } catch (err) {
        console.warn('[AnalyticsTracker Error] Falha ao registrar visita:', err);
      }
    };

    trackPageview();
  }, [location.pathname, location.search]);

  return null;
};
