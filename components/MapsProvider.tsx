import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY, PLACES_LIBRARIES } from '../lib/maps';

/**
 * Provider único do Google Maps por página.
 *
 * Só envolve as rotas que usam mapa (criação/convite) — a landing nunca
 * carrega o script. Com `libraries=['places']` o autocomplete volta a ser
 * do Google (quando a Places API estiver ativa); sem Places, cai no OSM
 * grátis via proxy — o mapa continua sempre Google (Embed/JS).
 */
export const MapsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  if (!GOOGLE_MAPS_API_KEY) return <>{children}</>;
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={[...PLACES_LIBRARIES]}>
      {children}
    </APIProvider>
  );
};
