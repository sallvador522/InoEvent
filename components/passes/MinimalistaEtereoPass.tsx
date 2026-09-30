import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PassPhoto } from './PassPhoto';
import { MINIMALISTA_ETEREO, PASS_SIZE, formatPassDateTime, monogram } from '../../lib/passTheme';
import type { PassEventData } from './OuroImperialPass';
import { PassFooter } from './PassFooter';

/**
 * Passe Minimalista Etéreo (MODERN) — Camila & Tiago.
 * Véu branco sobre a foto, cartão fosco com tracking largo, taupe + areia.
 * Sem selo de tema. Render puro 1080×1350 para PNG (html-to-image).
 */
interface Props {
  event: PassEventData;
  guestName: string;
  guestId: string;
}

export const MinimalistaEtereoPass = React.forwardRef<HTMLDivElement, Props>(({ event, guestName, guestId }, ref) => {
  const p = MINIMALISTA_ETEREO;
  const { date, time } = formatPassDateTime(event.isoDate, event.date, event.time);
  const mono = monogram(event.brideName, event.groomName, event.title);
  const venue = event.locationName || event.address || 'Local a definir';

  return (
    <div
      ref={ref}
      style={{
        width: PASS_SIZE.width,
        height: PASS_SIZE.height,
        background: p.bg,
        color: p.ink,
        fontFamily: p.fontBody,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Foto com véu */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 72px 0' }}>
        <div
          style={{
            width: '100%',
            height: 520,
            borderRadius: 24,
            overflow: 'hidden',
            border: '1px solid rgba(138,129,124,0.35)',
            boxShadow: '0 24px 60px rgba(120,110,100,0.18)',
            position: 'relative',
          }}
        >
          <PassPhoto
            src={event.heroImage}
            fallback="/chany-pedro-preview.webp"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.28)' }} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(253,253,253,0.95) 0%, rgba(253,253,253,0) 45%)',
            }}
          />
          <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center' }}>
            <p style={{ fontSize: 22, letterSpacing: 8, color: p.muted, margin: 0, fontWeight: 600 }}>CONVITE DE CASAMENTO</p>
            <p style={{ fontFamily: p.fontHead, fontSize: 60, color: p.ink, margin: '6px 0 0' }}>{mono}</p>
          </div>
        </div>
      </div>

      {/* Cartão fosco */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 96px 0', textAlign: 'center' }}>
        <div
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(138,129,124,0.3)',
            borderRadius: 24,
            padding: '24px 32px',
            boxShadow: '0 16px 48px rgba(120,110,100,0.12)',
          }}
        >
          <p style={{ fontSize: 22, letterSpacing: 6, color: p.muted, margin: 0, fontWeight: 600 }}>CONVIDADO</p>
          <p
            style={{
              fontFamily: p.fontHead,
              fontSize: 58,
              color: p.ink,
              margin: '6px 0 0',
              lineHeight: 1.1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {guestName || 'Nome do Convidado'}
          </p>
          <div style={{ width: 72, height: 2, background: p.gold, margin: '12px auto', borderRadius: 2 }} />
          <p style={{ fontFamily: p.fontHead, fontSize: 40, margin: 0 }}>{event.title}</p>
          <p style={{ fontSize: 26, color: p.muted, margin: '8px 0 0' }}>
            {date}
            {time ? ` · ${time}` : ''}
          </p>
          <p style={{ fontSize: 26, color: p.muted, margin: '4px 0 0' }}>{venue}</p>
        </div>

        <div
          style={{
            marginTop: 20,
            background: '#fff',
            border: '1px solid rgba(138,129,124,0.4)',
            borderRadius: 28,
            padding: 18,
            boxShadow: '0 12px 36px rgba(120,110,100,0.14)',
          }}
        >
          <QRCodeSVG value={`guest=${guestId}`} size={220} level="H" includeMargin={false} />
        </div>
        <p style={{ fontSize: 20, letterSpacing: 5, color: p.muted, margin: '10px 0 0', fontWeight: 600 }}>PASSE DE ENTRADA</p>
      </div>

      <PassFooter palette={p} />
    </div>
  );
});

MinimalistaEtereoPass.displayName = 'MinimalistaEtereoPass';
