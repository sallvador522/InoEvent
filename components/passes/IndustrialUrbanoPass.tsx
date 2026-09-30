import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PassPhoto } from './PassPhoto';
import { INDUSTRIAL_URBANO, PASS_SIZE, formatPassDateTime, monogram } from '../../lib/passTheme';
import type { PassEventData } from './OuroImperialPass';
import { PassFooter } from './PassFooter';

/**
 * Passe Industrial Urbano (INDUSTRIAL) — Bianca & Gabriel.
 * Carvão + âmbar de galpão, cantos retos, etiquetas em tracking largo.
 * Sem selo de tema, sem código. 1080×1350 para PNG.
 */
interface Props {
  event: PassEventData;
  guestName: string;
  guestId: string;
}

export const IndustrialUrbanoPass = React.forwardRef<HTMLDivElement, Props>(({ event, guestName, guestId }, ref) => {
  const p = INDUSTRIAL_URBANO;
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
      {/* Barra superior */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '30px 72px 0',
        }}
      >
        <span style={{ fontSize: 22, letterSpacing: 5, color: p.gold, fontWeight: 700 }}>PASSE DE ENTRADA</span>
        <span style={{ fontSize: 22, letterSpacing: 5, color: p.muted, fontWeight: 600 }}>{mono}</span>
      </div>

      {/* Foto emoldurada reta */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 72px 0' }}>
        <div
          style={{
            width: '100%',
            height: 500,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid rgba(232,163,61,0.5)',
            outline: '8px solid #fff',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            position: 'relative',
          }}
        >
          <PassPhoto
            src={event.heroImage}
            fallback="/chany-pedro-preview.webp"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 50%)',
            }}
          />
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 72px 0', textAlign: 'center' }}>
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
        <p style={{ fontFamily: p.fontHead, fontSize: 38, color: p.ink, margin: '8px 0 0' }}>{event.title}</p>
        <p style={{ fontSize: 25, color: p.muted, margin: '8px 0 0' }}>
          {date}
          {time ? ` · ${time}` : ''}
        </p>
        <p style={{ fontSize: 25, color: p.muted, margin: '4px 0 0' }}>{venue}</p>

        <div
          style={{
            marginTop: 16,
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            boxShadow: `0 12px 40px ${p.gold}44`,
          }}
        >
          <QRCodeSVG value={`guest=${guestId}`} size={225} level="H" includeMargin={false} />
        </div>
      </div>

      <PassFooter palette={p} />
    </div>
  );
});

IndustrialUrbanoPass.displayName = 'IndustrialUrbanoPass';
