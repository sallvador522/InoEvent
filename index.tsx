import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FirebaseContext } from './components/firebase-context';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';

// Boot stub: the Firebase SDK (firebase-vendor, ~869KB) must NOT sit in the
// critical path. The app paints immediately under this stub — same shape and
// same localStorage cache keys as the real provider — while the real
// FirebaseProvider loads idle/in background and takes over without remounting
// App (context value swap only, same UI states).
function readCached(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* sem cache — segue como anónimo */ }
  return null;
}

const FirebaseBoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [RealProvider, setRealProvider] = useState<React.ComponentType<{ children: React.ReactNode }> | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      import('./components/FirebaseProvider')
        .then((m) => { if (!cancelled) setRealProvider(() => m.FirebaseProvider); })
        .catch(() => { /* stub mantém-se; rotas protegidas mostram loader */ });
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(load, { timeout: 2500 });
    } else {
      setTimeout(load, 1200);
    }
    return () => { cancelled = true; };
  }, []);
  // Mesma semântica do provider real: loading=true até a Auth resolver,
  // exceto com utilizador em cache (pinta logo o estado logado).
  const stubValue = useMemo(() => {
    const cachedUser = readCached('ino_events_user_cache');
    return {
      user: cachedUser,
      loading: !cachedUser,
      userProfile: readCached('ino_events_profile_cache'),
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };
  }, []);
  if (!RealProvider) {
    return <FirebaseContext.Provider value={stubValue}>{children}</FirebaseContext.Provider>;
  }
  return <RealProvider>{children}</RealProvider>;
};

// Register Service Worker for offline capabilities and caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[InoEvents] Service Worker registrado com sucesso no escopo:', registration.scope);
      })
      .catch((err) => {
        const errorMsg = String(err);
        if (errorMsg.includes('Rejected') || errorMsg.includes('SecurityError') || errorMsg.includes('disallowed') || errorMsg.includes('denied')) {
          console.warn('[InoEvents] Registro do Service Worker ignorado de forma segura neste navegador/sandbox:', errorMsg);
        } else {
          console.error('[InoEvents] Falha ao registrar Service Worker:', err);
        }
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <FirebaseBoot>
        <App />
      </FirebaseBoot>
    </HelmetProvider>
  </React.StrictMode>
);
