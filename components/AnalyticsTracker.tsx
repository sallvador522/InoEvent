import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from './FirebaseProvider';
import { collection, addDoc } from 'firebase/firestore';
import { initPixel, trackPixelPageView, trackPixelViewContent } from '../lib/metaPixel';

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

/** Corre o callback quando o browser estiver idle — nunca compete com o first paint. */
const runWhenIdle = (cb: () => void): void => {
  try {
    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(cb, { timeout: 2500 });
    } else {
      setTimeout(cb, 1500);
    }
  } catch {
    setTimeout(cb, 1500);
  }
};

export const AnalyticsTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const search = location.search;

    // Skip tracking of editing mode or admin panel to avoid skewing real user traffic
    if (search.includes('edit=true') || path.startsWith('/admin')) {
      return;
    }

    // Check if we already tracked this page in the current session
    const sessionKey = `ino_track_${path}`;
    try {
      if (sessionStorage.getItem(sessionKey)) {
        return;
      }
      sessionStorage.setItem(sessionKey, 'true');
    } catch {
      /* storage indisponível — segue para o tracking leve */
    }

    // Sinais baratos e síncronos primeiro (não bloqueiam a renderização)
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'G-8P6CGLFLLJ', {
          page_path: path + search,
          page_title: document.title
        });
      }
    } catch {
      /* no-op */
    }

    // Meta Pixel PageView (SPA) — só dispara com consentimento (no-op sem aceite)
    try {
      initPixel();
      trackPixelPageView(path + search);
    } catch {
      /* no-op */
    }

    // Extract event ID from the path if it exists
    // Supported patterns: /invite/:id, /client-dashboard/:id, /checkin/:id
    const inviteMatch = path.match(/^\/invite\/([^/]+)/);
    const clientDashMatch = path.match(/^\/client-dashboard\/([^/]+)/);
    const checkinMatch = path.match(/^\/checkin\/([^/]+)/);

    let eventId = '';
    if (inviteMatch) {
      eventId = inviteMatch[1];
    } else if (clientDashMatch) {
      eventId = clientDashMatch[1];
    } else if (checkinMatch) {
      eventId = checkinMatch[1];
    }

    // Meta Pixel ViewContent na abertura de convite — 1x por sessão (mesma chave acima)
    if (inviteMatch && eventId) {
      try {
        trackPixelViewContent(eventId);
      } catch {
        /* no-op */
      }
    }

    // Escrita no Firestore adiada para o idle — fire-and-forget, nunca await na rota.
    // Antes: `await addDoc(...)` segurava o effect e competia com o LCP da landing.
    runWhenIdle(() => {
      try {
        const device = getDeviceType();
        const browser = getBrowserType();
        const referrer = document.referrer ? new URL(document.referrer).hostname : 'Direto';
        void addDoc(collection(db, 'visits'), {
          path,
          eventId: eventId || null,
          device,
          browser,
          referrer,
          timestamp: new Date().toISOString()
        }).catch((err) => {
          console.warn('[AnalyticsTracker Error] Falha ao registrar visita:', err);
        });
      } catch (err) {
        console.warn('[AnalyticsTracker Error] Falha ao registrar visita:', err);
      }
    });
  }, [location.pathname, location.search]);

  return null;
};
