import React, { useEffect, useState } from 'react';
import { CONSENT_KEY, hasPixelConsent, initPixel, setPixelConsent } from '../lib/metaPixel';

/**
 * Banner de consentimento (cookies/analytics).
 * - Só mostra se ainda não houver escolha em `localStorage`.
 * - No "Aceitar": grava consentimento + faz init do Meta Pixel + PageView inicial.
 * - No "Recusar": nunca carrega/dispara o Pixel (stays no-op).
 */
export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        // Pequeno delay para não competir com o PageLoader inicial
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
      // Se já aceitou numa visita anterior, garante init (ex: hard refresh)
      if (stored === 'accepted' && hasPixelConsent()) {
        initPixel();
      }
    } catch {
      setVisible(false);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    setPixelConsent('accepted');
    initPixel();
    try {
      window.fbq?.('track', 'PageView');
    } catch {
      /* no-op */
    }
    setVisible(false);
  };

  const decline = () => {
    setPixelConsent('declined');
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentimento de cookies"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-[90] rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-md shadow-2xl p-4 text-slate-200"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <p className="text-sm font-semibold text-white mb-1">Privacidade e cookies</p>
      <p className="text-xs leading-relaxed text-slate-300 mb-3">
        Usamos cookies e o Pixel da Meta para medir visitas e melhorar a InoEvents.
        Podes aceitar ou recusar — a app funciona igual.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={decline}
          className="flex-1 h-10 rounded-xl border border-white/15 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/5 transition-colors"
        >
          Recusar
        </button>
        <button
          type="button"
          onClick={accept}
          className="flex-1 h-10 rounded-xl bg-white text-slate-900 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
};
