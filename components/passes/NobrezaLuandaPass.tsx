import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { NOBREZA_LUANDA, PASS_SIZE, formatPassDateTime, monogram } from '../../lib/passTheme';
import { PassFooter } from './PassFooter';
import type { PassEventData } from './OuroImperialPass';

/**
 * Passe Nobreza de Luanda (LIMINTSO_ME) — Marnela & Evandro.
 * Dourado #E9BE5D sobre marfim + faixa noir; barra dourada editorial.
 * Render puro 1080×1350 para exportar em PNG (html-to-image).
 */
interface Props {
  event: PassEventData;
  guestName: string;
  guestId: string;
}

export const NobrezaLuandaPass = React.forwardRef<HTMLDivElement, Props>(({ event, guestName, guestId }, ref) => {
  const p = NOBREZA_LUANDA;
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
      {/* Faixa editorial noir */}
      <div
        style={{
          background: '#121212',
          color: '#fff',
          textAlign: 'center',
          padding: '22px 0',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 6,
        }}
      >
        PASSE DE ENTRADA
      </div>

      {/* Foto emoldurada (moldura branca dupla com filete ouro) */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 72px 0' }}>
        <div
          style={{
            width: '100%',
            height: 470,
            borderRadius: 28,
            overflow: 'hidden',
            border: '12px solid #fff',
            outline: `2px solid ${p.gold}`,
            outlineOffset: -2,
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
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
              background: 'linear-gradient(to top, rgba(10,10,10,0.78) 0%, rgba(10,10,10,0.12) 60%, rgba(10,10,10,0.30) 100%)',
            }}
          />
          <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center' }}>
            <p style={{ fontFamily: p.fontHead, fontSize: 62, color: '#fff', margin: 0, letterSpacing: 2 }}>{mono}</p>
            <div style={{ width: 90, height: 2, background: p.gold, margin: '8px auto 0', borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 72px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 24, color: p.goldDeep, margin: 0, letterSpacing: 5, fontWeight: 700 }}>CONVIDADO</p>
        <p
          style={{
            fontFamily: p.fontHead,
            fontSize: 60,
            color: p.ink,
            margin: '8px 0 0',
            lineHeight: 1.1,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {guestName || 'Nome do Convidado'}
        </p>
        <p style={{ fontFamily: p.fontHead, fontSize: 42, margin: '10px 0 0' }}>{event.title}</p>
        <p style={{ fontSize: 27, color: p.muted, margin: '8px 0 0' }}>
          {date}
          {time ? ` · ${time}` : ''}
        </p>
        <p style={{ fontSize: 27, color: p.muted, margin: '4px 0 0' }}>{venue}</p>

        <div
          style={{
            marginTop: 24,
            background: '#fff',
            border: '3px solid #121212',
            outline: `2px solid ${p.gold}`,
            outlineOffset: 6,
            borderRadius: 28,
            padding: 22,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          }}
        >
          <QRCodeSVG value={`guest=${guestId}`} size={280} level="H" includeMargin={false} />
        </div>
      </div>

      {/* Rodapé InoEvents (partilhado, obrigatório em todos os passes) */}
      <PassFooter palette={p} />
    </div>
  );
});

NobrezaLuandaPass.displayName = 'NobrezaLuandaPass';
