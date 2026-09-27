import React from 'react';
import { OuroImperialPass, type PassEventData } from './OuroImperialPass';
import { NobrezaLuandaPass } from './NobrezaLuandaPass';
import { ClassicoRomanticoPass } from './ClassicoRomanticoPass';
import { MinimalistaEtereoPass } from './MinimalistaEtereoPass';
import { JardimElegantePass } from './JardimElegantePass';
import { LuxuosoBlackTiePass } from './LuxuosoBlackTiePass';
import { RusticoChicPass } from './RusticoChicPass';
import { IndustrialUrbanoPass } from './IndustrialUrbanoPass';

/**
 * Roteador de passes elegantes por layoutMode.
 * Temas novos entram aqui (1 case por tema) — chamadores não mudam.
 */
export type { PassEventData };

const ELEGANT_PASS_MODES = ['LIMINTSO_GOLD', 'LIMINTSO_ME', 'CLASSIC', 'MODERN', 'GARDEN', 'LUXURY', 'RUSTIC', 'INDUSTRIAL'];

export function supportsElegantPass(layoutMode?: string): boolean {
  return ELEGANT_PASS_MODES.includes(layoutMode || '');
}

interface Props {
  layoutMode?: string;
  event: PassEventData;
  guestName: string;
  guestId: string;
}

export const EventPass = React.forwardRef<HTMLDivElement, Props>(({ layoutMode, event, guestName, guestId }, ref) => {
  if (layoutMode === 'LIMINTSO_ME') {
    return <NobrezaLuandaPass ref={ref} event={event} guestName={guestName} guestId={guestId} />;
  }
  if (layoutMode === 'CLASSIC') {
    return <ClassicoRomanticoPass ref={ref} event={event} guestName={guestName} guestId={guestId} />;
  }
  if (layoutMode === 'MODERN') {
    return <MinimalistaEtereoPass ref={ref} event={event} guestName={guestName} guestId={guestId} />;
  }
  if (layoutMode === 'GARDEN') {
    return <JardimElegantePass ref={ref} event={event} guestName={guestName} guestId={guestId} />;
  }
  if (layoutMode === 'LUXURY') {
    return <LuxuosoBlackTiePass ref={ref} event={event} guestName={guestName} guestId={guestId} />;
  }
  if (layoutMode === 'RUSTIC') {
    return <RusticoChicPass ref={ref} event={event} guestName={guestName} guestId={guestId} />;
  }
  if (layoutMode === 'INDUSTRIAL') {
    return <IndustrialUrbanoPass ref={ref} event={event} guestName={guestName} guestId={guestId} />;
  }
  return <OuroImperialPass ref={ref} event={event} guestName={guestName} guestId={guestId} />;
});

EventPass.displayName = 'EventPass';
