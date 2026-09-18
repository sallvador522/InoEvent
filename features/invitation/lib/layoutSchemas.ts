import type { LayoutMode } from '../../../types';

/**
 * Contrato de dados por template (schema-driven).
 *
 * Cada layoutMode declara as secções que REALMENTE renderiza no convite
 * (levantamento verificado em InvitationView.tsx). O questionário e o editor
 * usam este contrato para pedir só o que vai aparecer — nunca se preenche
 * o que o tema escolhido esconde.
 *
 * Música não está aqui: o TocaPlayer é global em todos os temas.
 * Guestbook é premium e vive só no editor — fora do questionário.
 */
export type SectionKey =
  | 'timeline'
  | 'dressCode'
  | 'gifts'
  | 'gallery'
  | 'reception'
  | 'countdown'
  | 'map';

export const SECTION_LABELS: Record<SectionKey, string> = {
  timeline: 'Programação',
  dressCode: 'Dress Code',
  gifts: 'Presentes',
  gallery: 'Galeria',
  reception: 'Receção',
  countdown: 'Contagem regressiva',
  map: 'Mapa',
};

const WEDDING_FULL: SectionKey[] = [
  'timeline',
  'dressCode',
  'gifts',
  'gallery',
  'reception',
  'countdown',
  'map',
];

export const LAYOUT_SECTIONS: Record<LayoutMode, SectionKey[]> = {
  CLASSIC: [...WEDDING_FULL],
  MODERN: [...WEDDING_FULL],
  GARDEN: [...WEDDING_FULL],
  // Rústico não tem secção de galeria
  RUSTIC: ['timeline', 'dressCode', 'gifts', 'reception', 'countdown', 'map'],
  INDUSTRIAL: [...WEDDING_FULL],
  // Luxo não tem cronograma/programação
  LUXURY: ['dressCode', 'gifts', 'gallery', 'reception', 'countdown', 'map'],
  BRIDAL_BEAUTY: ['gifts', 'gallery', 'map'],
  BRIDAL_ROMANTIC: ['gifts', 'gallery', 'map'],
  BRIDAL_MINIMAL: ['gifts', 'gallery', 'map'],
  BRIDAL_TEA_PARTY: ['gifts', 'gallery', 'map'],
  BRIDAL_CHEF: ['gifts', 'gallery', 'map'],
  BRIDAL_TROPICAL: ['gifts', 'gallery', 'map'],
  BABY_BOY: ['gifts', 'gallery', 'map'],
  BABY_GIRL: ['gifts', 'gallery', 'map'],
  BABY_NEUTRAL: ['gifts', 'gallery', 'map'],
  // Ouro Imperial não tem galeria
  LIMINTSO_GOLD: ['timeline', 'dressCode', 'gifts', 'reception', 'countdown', 'map'],
  // Nobreza de Luanda não tem contagem regressiva
  LIMINTSO_ME: ['timeline', 'dressCode', 'gifts', 'gallery', 'reception', 'map'],
};

/** O layout renderiza esta secção no convite? */
export function layoutSupports(layout: string | null | undefined, section: SectionKey): boolean {
  if (!layout) return false;
  return (LAYOUT_SECTIONS[layout as LayoutMode] || []).includes(section);
}

/** Secções que existem em `from` e desaparecem em `to` (para avisar sem apagar dados). */
export function hiddenSectionsFor(from: string, to: string): SectionKey[] {
  const a = LAYOUT_SECTIONS[from as LayoutMode] || [];
  const b = new Set(LAYOUT_SECTIONS[to as LayoutMode] || []);
  return a.filter((s) => !b.has(s));
}
