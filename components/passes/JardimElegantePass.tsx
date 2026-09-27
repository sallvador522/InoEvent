import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { JARDIM_ELEGANTE, PASS_SIZE, formatPassDateTime, monogram } from '../../lib/passTheme';
import type { PassEventData } from './OuroImperialPass';
import { PassFooter } from './PassFooter';

/**
 * Passe Jardim Elegante (GARDEN) — Mariana & Ricardo.
 * Verde-sálvia sobre marfim de jardim, foto emoldurada, serifas suaves.
 * Sem selo de tema. Render puro 1080×1350 para PNG (html-to-image).
 */
interface Props {
  event: PassEventData;
  guestName: string;
  guestId: string;
}

export const JardimElegantePass = React.forwardRef<HTMLDivElement, Props>(({ event, guestName, guestId }, ref) => {
  const p = JARDIM_ELEGANTE;
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
      <div style={{ textAlign: 'center', padding: '30px 0 16px' }}>
        <p style={{ fontSize: 22, letterSpacing: 7, color: p.gold, margin: 0, fontWeight: 700 }}>SAVE THE DATE</p>
      </div>

      {/* Foto emoldurada */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 72px' }}>
        <div
          style={{
            width: '100%',
            height: 520,
            borderRadius: 28,
            overflow: 'hidden',
            border: '12px solid #fff',
            boxShadow: '0 20px 60px rgba(93,109,85,0.30)',
            position: 'relative',
          }}
        >
          <img
            src={event.heroImage || '/chany-pedro-preview.webp'}
            alt="Casal"
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(46,58,42,0.55) 0%, rgba(46,58,42,0) 50%)',
            }}
          />
          <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center' }}>
            <p style={{ fontFamily: p.fontHead, fontSize: 58, color: '#fff', margin: 0, letterSpacing: 2 }}>{mono}</p>
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 72px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 22, color: p.goldDeep, margin: 0, letterSpacing: 5, fontWeight: 700 }}>CONVIDADO</p>
        <p
          style={{
            fontFamily: p.fontHead,
            fontSize: 56,
            color: p.ink,
            margin: '6px 0 0',
            lineHeight: 1.1,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {guestName || 'Nome do Convidado'}
        </p>
        <div style={{ width: 90, height: 2, background: p.gold, margin: '10px auto', borderRadius: 2 }} />
        <p style={{ fontFamily: p.fontHead, fontSize: 40, margin: 0 }}>{event.title}</p>
        <p style={{ fontSize: 26, color: p.muted, margin: '8px 0 0' }}>
          {date}
          {time ? ` · ${time}` : ''}
        </p>
        <p style={{ fontSize: 26, color: p.muted, margin: '4px 0 0' }}>{venue}</p>

        <div
          style={{
            marginTop: 18,
            background: '#fff',
            border: `2px solid ${p.gold}`,
            borderRadius: 32,
            padding: 18,
            boxShadow: '0 12px 36px rgba(93,109,85,0.22)',
          }}
        >
          <QRCodeSVG value={`guest=${guestId}`} size={230} level="H" includeMargin={false} />
        </div>
        <p style={{ fontSize: 20, letterSpacing: 5, color: p.muted, margin: '10px 0 0', fontWeight: 600 }}>PASSE DE ENTRADA</p>
      </div>

      <PassFooter palette={p} />
    </div>
  );
});

JardimElegantePass.displayName = 'JardimElegantePass';
