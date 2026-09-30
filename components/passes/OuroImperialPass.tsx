import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PassPhoto } from './PassPhoto';
import { OURO_IMPERIAL, PASS_SIZE, formatPassDateTime, monogram } from '../../lib/passTheme';
import { PassFooter } from './PassFooter';

/**
 * Passe Ouro Imperial (LIMINTSO_GOLD) — Chany & Pedro.
 * Render puro 1080×1350 para exportar em PNG (html-to-image).
 * Em teste, o QR carrega `guest=TESTE-{nome}` (nunca ID real).
 */
export interface PassEventData {
  title: string;
  brideName?: string;
  groomName?: string;
  isoDate?: string;
  date?: string;
  time?: string;
  locationName?: string;
  address?: string;
  heroImage?: string;
}

interface Props {
  event: PassEventData;
  guestName: string;
  guestId: string;
}

export const OuroImperialPass = React.forwardRef<HTMLDivElement, Props>(({ event, guestName, guestId }, ref) => {
  const p = OURO_IMPERIAL;
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
      {/* Topo: foto do casal emoldurada (padrão Clássico) */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 72px 0' }}>
        <div
          style={{
            width: '100%',
            height: 560,
            borderRadius: 36,
            overflow: 'hidden',
            border: '14px solid #fff',
            boxShadow: '0 20px 60px rgba(138,109,28,0.28)',
            position: 'relative',
          }}
        >
          <PassPhoto
            src={event.heroImage}
            fallback="/chany-pedro-preview.webp"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(20,14,4,0.72) 0%, rgba(20,14,4,0.15) 55%, rgba(20,14,4,0.25) 100%)',
            }}
          />
          <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center' }}>
            <p style={{ fontFamily: p.fontHead, fontSize: 68, color: '#fff', margin: 0, letterSpacing: 2 }}>{mono}</p>
            <p style={{ fontSize: 23, color: p.gold, letterSpacing: 6, margin: '4px 0 0', fontWeight: 600 }}>PASSE DE ENTRADA</p>
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 72px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 24, color: p.muted, margin: 0, letterSpacing: 2 }}>CONVIDADO</p>
        <p
          style={{
            fontFamily: p.fontHead,
            fontSize: 60,
            color: p.goldDeep,
            margin: '6px 0 0',
            lineHeight: 1.1,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {guestName || 'Nome do Convidado'}
        </p>
        <div style={{ width: 120, height: 3, background: p.gold, margin: '20px 0', borderRadius: 2 }} />
        <p style={{ fontFamily: p.fontHead, fontSize: 44, margin: 0 }}>{event.title}</p>
        <p style={{ fontSize: 26, color: p.muted, margin: '10px 0 0' }}>
          {date}
          {time ? ` · ${time}` : ''}
        </p>
        <p style={{ fontSize: 26, color: p.muted, margin: '6px 0 0' }}>{venue}</p>

        {/* QR */}
        <div
          style={{
            marginTop: 20,
            background: '#fff',
            border: `3px solid ${p.gold}`,
            borderRadius: 32,
            padding: 20,
            boxShadow: '0 12px 40px rgba(180,146,50,0.25)',
          }}
        >
          <QRCodeSVG value={`guest=${guestId}`} size={230} level="H" includeMargin={false} />
        </div>
      </div>

      {/* Rodapé InoEvents (partilhado, obrigatório em todos os passes) */}
      <PassFooter palette={p} />
    </div>
  );
});

OuroImperialPass.displayName = 'OuroImperialPass';
