import React from 'react';
import type { PassPalette } from '../../lib/passTheme';

/**
 * Faixa InoEvents — rodapé OBRIGATÓRIO e idêntico em todos os passes.
 * Usa a paleta do tema mas nunca muda texto nem estrutura.
 */
export const PassFooter: React.FC<{ palette: PassPalette }> = ({ palette: p }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: '18px 0 28px',
      borderTop: `1px solid ${p.gold}66`,
      margin: '0 72px',
    }}
  >
    <span style={{ fontFamily: p.fontHead, fontSize: 26, color: p.goldDeep, fontWeight: 700 }}>InoEvents</span>
    <span style={{ fontSize: 22, color: p.muted }}>· convite digital premium</span>
  </div>
);
