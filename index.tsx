import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FirebaseProvider } from './components/FirebaseProvider';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';

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
      <FirebaseProvider>
        <App />
      </FirebaseProvider>
    </HelmetProvider>
  </React.StrictMode>
);
