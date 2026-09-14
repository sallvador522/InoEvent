/**
 * Google Maps — helpers partilhados (convite + criação).
 *
 * A chave é pública (restrita por referrer HTTP no Cloud Console) e chega
 * via `VITE_GOOGLE_MAPS_API_KEY`. Sem chave, os componentes degradam para
 * iframe/link manual — nunca bloqueiam o fluxo.
 */

export const GOOGLE_MAPS_API_KEY: string =
  ((import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY as string) || '';

/** module-level para o APIProvider não recarregar o script a cada render */
export const PLACES_LIBRARIES: Array<string> = ['places'];

export interface PlaceSelection {
  /** Nome do estabelecimento/local (ex: "Igreja da Sagrada Família") */
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  mapLink: string;
}

export function hasCoords(event: {
  latitude?: number | null;
  longitude?: number | null;
}): boolean {
  return (
    typeof event?.latitude === 'number' &&
    typeof event?.longitude === 'number' &&
    isFinite(event.latitude) &&
    isFinite(event.longitude)
  );
}

export function buildMapLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** src do iframe (grátis, sem chave). '' quando não há como montar query. */
export function buildEmbedSrc(event: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  locationName?: string;
}): string {
  if (hasCoords(event)) {
    return `https://www.google.com/maps?q=${event.latitude},${event.longitude}&z=15&output=embed`;
  }
  const q = (event?.address || event?.locationName || '').trim();
  if (!q) return '';
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}
