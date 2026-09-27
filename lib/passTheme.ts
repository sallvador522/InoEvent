/**
 * passTheme — tokens partilhados dos passes elegantes (PNG para baixar).
 * Começa no Ouro Imperial (LIMINTSO_GOLD); outros temas entram depois,
 * cada um no seu ficheiro em components/passes/.
 */

export const PASS_SIZE = { width: 1080, height: 1350 } as const;

export interface PassPalette {
  bg: string;
  ink: string;
  muted: string;
  gold: string;
  goldDeep: string;
  card: string;
  fontHead: string;
  fontBody: string;
}

export const OURO_IMPERIAL: PassPalette = {
  bg: '#FCFAF6',
  ink: '#2C2924',
  muted: '#8a7f72',
  gold: '#dcb349',
  goldDeep: '#8a6d1c',
  card: '#FFFDF9',
  fontHead: "'Playfair Display', Georgia, serif",
  fontBody: "'Inter', system-ui, sans-serif",
};

export const NOBREZA_LUANDA: PassPalette = {
  bg: '#FCFAF6',
  ink: '#121212',
  muted: '#6f6a60',
  gold: '#E9BE5D',
  goldDeep: '#9a7a24',
  card: '#FFFFFF',
  fontHead: "'Playfair Display', Georgia, serif",
  fontBody: "'Josefin Sans', 'Inter', system-ui, sans-serif",
};

export const CLASSICO_ROMANTICO: PassPalette = {
  bg: '#FDFBF7',
  ink: '#1B365D',
  muted: '#7c8aa0',
  gold: '#C5A028',
  goldDeep: '#8a6d1c',
  card: '#FFFFFF',
  fontHead: "'Great Vibes', 'Dancing Script', cursive",
  fontBody: "'Inter', system-ui, sans-serif",
};

export const MINIMALISTA_ETEREO: PassPalette = {
  bg: '#FDFDFD',
  ink: '#1a1a1a',
  muted: '#8A817C',
  gold: '#C2B280',
  goldDeep: '#7a6a4a',
  card: '#FFFFFF',
  fontHead: "'Playfair Display', Georgia, serif",
  fontBody: "'Inter', system-ui, sans-serif",
};

export const JARDIM_ELEGANTE: PassPalette = {
  bg: '#F9F6F2',
  ink: '#4A4A4A',
  muted: '#8b9187',
  gold: '#5D6D55',
  goldDeep: '#46523f',
  card: '#FFFFFF',
  fontHead: "'Playfair Display', Georgia, serif",
  fontBody: "'Inter', system-ui, sans-serif",
};

export const LUXUOSO_BLACK_TIE: PassPalette = {
  bg: '#0F1419',
  ink: '#f2ede4',
  muted: '#9a917f',
  gold: '#BF9B30',
  goldDeep: '#BF9B30',
  card: '#161b22',
  fontHead: "'Playfair Display', Georgia, serif",
  fontBody: "'Inter', system-ui, sans-serif",
};

export const RUSTICO_CHIC: PassPalette = {
  bg: '#FAF6F0',
  ink: '#3E2F25',
  muted: '#97816f',
  gold: '#A67B5B',
  goldDeep: '#7c5a40',
  card: '#FFFDF9',
  fontHead: "'Playfair Display', Georgia, serif",
  fontBody: "'Inter', system-ui, sans-serif",
};

export const INDUSTRIAL_URBANO: PassPalette = {
  bg: '#1c1c1e',
  ink: '#f4f1ea',
  muted: '#a09a8d',
  gold: '#E8A33D',
  goldDeep: '#E8A33D',
  card: '#262628',
  fontHead: "'Playfair Display', Georgia, serif",
  fontBody: "'Inter', system-ui, sans-serif",
};

/** Data/hora pt-AO a partir de isoDate + time (fallbacks seguros para mock). */
export function formatPassDateTime(isoDate?: string, date?: string, time?: string): { date: string; time: string } {
  let d: Date | null = null;
  try {
    if (isoDate) d = new Date(isoDate);
  } catch { d = null; }
  if ((!d || isNaN(d.getTime())) && date) {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  if (!d || isNaN(d.getTime())) {
    return { date: date || 'Data a definir', time: time || '' };
  }
  const dateStr = d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = time || `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date: dateStr, time: timeStr };
}

/** Monograma "C & P" a partir dos noivos ou do título. */
export function monogram(brideName?: string, groomName?: string, title?: string): string {
  if (brideName && groomName) {
    return `${brideName.trim().charAt(0)} & ${groomName.trim().charAt(0)}`;
  }
  const parts = (title || '').split('&');
  if (parts.length >= 2) {
    return `${parts[0].trim().charAt(0)} & ${parts[1].trim().charAt(0)}`;
  }
  return 'C & P';
}

/** Código curto legível do passe (fallback se o QR falhar na porta). */
export function shortPassCode(guestId: string): string {
  const clean = (guestId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return (clean.slice(-6) || 'CONVITE').padStart(6, '0');
}
