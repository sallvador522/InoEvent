import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PassPhoto } from './PassPhoto';
import { CLASSICO_ROMANTICO, PASS_SIZE, formatPassDateTime } from '../../lib/passTheme';
import { PassFooter } from './PassFooter';
import type { PassEventData } from './OuroImperialPass';

/**
 * Passe Clássico Romântico (CLASSIC) — Ana & João.
 * Foto em arco (assinatura do tema), "Save the Date", nomes em script,
 * moldura branca suave. Sem selo de tema (padrão dos passes).
 * Render puro 1080×1350 para exportar em PNG (html-to-image).
 */
interface Props {
  event: PassEventData;
  guestName: string;
  guestId: string;
}

export const ClassicoRomanticoPass = React.forwardRef<HTMLDivElement, Props>(({ event, guestName, guestId }, ref) => {
  const p = CLASSICO_ROMANTICO;
  const { date, time } = formatPassDateTime(event.isoDate, event.date, event.time);
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
      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', padding: '30px 0 18px' }}>
        <p style={{ fontSize: 22, letterSpacing: 8, color: p.muted, margin: 0, fontWeight: 600 }}>SAVE THE DATE</p>
      </div>

      {/* Foto em arco */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 90px' }}>
        <div
          style={{
            width: 640,
            height: 500,
            borderRadius: '320px 320px 48px 48px',
            overflow: 'hidden',
            border: '14px solid #fff',
            boxShadow: '0 20px 60px rgba(27,54,93,0.22)',
            position: 'relative',
          }}
        >
          <PassPhoto
            src={event.heroImage}
            fallback="/templaClassic/classPrinci-1.webp"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(27,54,93,0.45) 0%, rgba(27,54,93,0) 45%)',
            }}
          />
          <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, textAlign: 'center' }}>
            <p style={{ fontSize: 22, color: '#fff', letterSpacing: 6, margin: 0, fontWeight: 700 }}>PASSE DE ENTRADA</p>
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '26px 72px 0', textAlign: 'center' }}>
        <p style={{ fontFamily: p.fontHead, fontSize: 72, color: p.ink, margin: 0, lineHeight: 1 }}>
          {event.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '14px 0 4px' }}>
          <div style={{ width: 90, height: 1, background: p.gold }} />
          <p style={{ fontSize: 24, color: p.muted, margin: 0, letterSpacing: 3 }}>CONVIDADO</p>
          <div style={{ width: 90, height: 1, background: p.gold }} />
        </div>
        <p
          style={{
            fontFamily: p.fontHead,
            fontSize: 64,
            color: p.goldDeep,
            margin: 0,
            lineHeight: 1.1,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {guestName || 'Nome do Convidado'}
        </p>
        <p style={{ fontSize: 28, color: p.muted, margin: '10px 0 0' }}>
          {date}
          {time ? ` · ${time}` : ''}
        </p>
        <p style={{ fontSize: 28, color: p.muted, margin: '4px 0 0' }}>{venue}</p>

        <div
          style={{
            marginTop: 22,
            background: '#fff',
            border: `2px solid ${p.gold}`,
            borderRadius: 40,
            padding: 22,
            boxShadow: '0 12px 40px rgba(27,54,93,0.14)',
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

ClassicoRomanticoPass.displayName = 'ClassicoRomanticoPass';
