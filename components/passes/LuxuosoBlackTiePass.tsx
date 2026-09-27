import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { LUXUOSO_BLACK_TIE, PASS_SIZE, formatPassDateTime } from '../../lib/passTheme';
import type { PassEventData } from './OuroImperialPass';
import { PassFooter } from './PassFooter';

/**
 * Passe Luxuoso Black Tie (LUXURY) — Sofia & Eduardo.
 * Noir com moldura dourada (como o convite), monograma em medalhão,
 * "Convite Formal". Sem selo de tema. 1080×1350 para PNG.
 */
interface Props {
  event: PassEventData;
  guestName: string;
  guestId: string;
}

export const LuxuosoBlackTiePass = React.forwardRef<HTMLDivElement, Props>(({ event, guestName, guestId }, ref) => {
  const p = LUXUOSO_BLACK_TIE;
  const { date, time } = formatPassDateTime(event.isoDate, event.date, event.time);
  const initial = (event.title || 'S').trim().charAt(0).toUpperCase();
  const venue = event.locationName || event.address || 'Local a definir';

  return (
    <div
      ref={ref}
      style={{
        width: PASS_SIZE.width,
        height: PASS_SIZE.height,
        background: `radial-gradient(100% 100% at 50% 0%, #2C3038 0%, #0F1419 50%, #000000 100%)`,
        color: p.ink,
        fontFamily: p.fontBody,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', inset: 18, border: `1px solid ${p.gold}55`, borderRadius: 20, pointerEvents: 'none' }} />

      {/* Medalhão + título */}
      <div style={{ textAlign: 'center', padding: '44px 0 8px', position: 'relative' }}>
        <div
          style={{
            width: 104,
            height: 104,
            margin: '0 auto 12px',
            border: `1px solid ${p.gold}`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: p.fontHead,
            fontSize: 52,
            color: p.gold,
          }}
        >
          {initial}
        </div>
        <p style={{ fontSize: 20, color: p.gold, letterSpacing: 7, margin: 0, fontWeight: 600 }}>PASSE DE ENTRADA</p>
      </div>

      {/* Foto */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 96px 0', position: 'relative' }}>
        <div
          style={{
            width: '100%',
            height: 420,
            borderRadius: 20,
            overflow: 'hidden',
            border: `1px solid ${p.gold}66`,
            position: 'relative',
          }}
        >
          <img
            src={event.heroImage || '/chany-pedro-preview.webp'}
            alt="Casal"
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 55%)',
            }}
          />
          <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center' }}>
            <p style={{ fontFamily: p.fontHead, fontSize: 46, color: '#fff', margin: 0 }}>{event.title}</p>
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 72px 0', textAlign: 'center', position: 'relative' }}>
        <p style={{ fontSize: 20, color: p.gold, margin: 0, letterSpacing: 5, fontWeight: 700 }}>CONVIDADO</p>
        <p
          style={{
            fontFamily: p.fontHead,
            fontSize: 54,
            color: '#fff',
            margin: '6px 0 0',
            lineHeight: 1.1,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {guestName || 'Nome do Convidado'}
        </p>
        <p style={{ fontSize: 25, color: p.muted, margin: '8px 0 0' }}>
          {date}
          {time ? ` · ${time}` : ''}
        </p>
        <p style={{ fontSize: 25, color: p.muted, margin: '4px 0 0' }}>{venue}</p>

        <div
          style={{
            marginTop: 16,
            background: '#fff',
            border: `2px solid ${p.gold}`,
            borderRadius: 28,
            padding: 16,
            boxShadow: `0 12px 40px ${p.gold}33`,
          }}
        >
          <QRCodeSVG value={`guest=${guestId}`} size={220} level="H" includeMargin={false} />
        </div>
      </div>

      <PassFooter palette={p} />
    </div>
  );
});

LuxuosoBlackTiePass.displayName = 'LuxuosoBlackTiePass';
