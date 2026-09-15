/**
 * Google Maps — helpers partilhados (convite + criação).
 *
 * Só usamos o mapa para a LOCALIZAÇÃO do evento (pino + zona).
 * Sem Places/autocomplete: zero dependência da Places API.
 *
 * A chave é pública (restrita por referrer HTTP no Cloud Console) e chega
 * via `VITE_GOOGLE_MAPS_API_KEY`. Sem chave, os componentes degradam para
 * iframe/link manual — nunca bloqueiam o fluxo.
 */

export const GOOGLE_MAPS_API_KEY: string =
  ((import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY as string) || '';

export interface PlaceSelection {
  /** Zona/nome do local (ex: "Talatona, Luanda") */
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  mapLink: string;
}

/** Centro default (Luanda) quando ainda não há pino. */
export const DEFAULT_CENTER = { lat: -8.839, lng: 13.234 };

/** Bibliotecas do Google Maps a carregar — 'places' só é útil quando a Places API está ativa. */
export const PLACES_LIBRARIES = ['places'] as const;

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

/** Link de rota "Como chegar" até o pino. */
export function buildDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** "4.2 (128)" — devolve '' quando sem avaliação. */
export function formatRating(rating?: number | null, total?: number | null): string {
  if (typeof rating !== 'number' || !isFinite(rating)) return '';
  const r = rating.toFixed(1).replace('.', ',');
  if (typeof total === 'number' && isFinite(total) && total > 0) return `${r} ★ (${total})`;
  return `${r} ★`;
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
  const q = (event?.locationName || event?.address || '').trim();
  if (!q) return '';
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}

export interface ParsedMapLink {
  latitude: number;
  longitude: number;
  mapLink: string;
}

/**
 * Extrai coordenadas de um link do Google Maps colado pelo utilizador.
 * Formatos aceites: /@lat,lng,z · ?query=lat,lng · ?q=lat,lng · !3dlat!4dlng.
 * Links curtos (goo.gl/maps/...) NÃO expandem no cliente — retorna null
 * e o chamador deve pedir o link completo.
 */
export function parseCoordsFromMapUrl(raw: string): ParsedMapLink | null {
  if (!raw || typeof raw !== 'string') return null;
  let url = raw.trim();
  if (!url) return null;
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(url)) url = `https://${url}`;
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    /* usa o raw */
  }

  const finish = (lat: number, lng: number): ParsedMapLink | null => {
    if (!isFinite(lat) || !isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { latitude: lat, longitude: lng, mapLink: url };
  };

  // 1) /@lat,lng,15z  (links "partilhar" e place/@)
  let m = decoded.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:,|$|[?/&])/);
  if (m) {
    const r = finish(Number(m[1]), Number(m[2]));
    if (r) return r;
  }

  // 2) ?query=lat,lng ou ?q=lat,lng (links de pesquisa)
  m = decoded.match(/[?&](?:query|q)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:&|$)/);
  if (m) {
    const r = finish(Number(m[1]), Number(m[2]));
    if (r) return r;
  }

  // 3) !3dlat!4dlng (embed / place data)
  m = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (m) {
    const r = finish(Number(m[1]), Number(m[2]));
    if (r) return r;
  }
  m = decoded.match(/!4d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/);
  if (m) {
    const r = finish(Number(m[2]), Number(m[1]));
    if (r) return r;
  }

  return null;
}

/** true quando o link é curto e não dá para extrair coords no cliente. */
export function isShortMapLink(raw: string): boolean {
  return /goo\.gl\/maps|maps\.app\.gl/.test(raw || '');
}

export interface ZoneResult {
  /** Nome curto (ex: "Acádia") */
  name: string;
  /** Nome completo (ex: "Acádia, Luanda, Angola") */
  displayName: string;
  latitude: number;
  longitude: number;
  /** Detalhes ricos (só Google tem rating/plusCode/foto) */
  placeId?: string | null;
  formattedAddress?: string | null;
  plusCode?: string | null;
  rating?: number | null;
  userRatingsTotal?: number | null;
  mapsUrl?: string | null;
  photoUrl?: string | null;
  source?: 'google' | 'osm' | null;
}

/**
 * Busca de zonas — usa o proxy do servidor (/api/geo/search) que por sua
 * vez consulta o Nominatim com User-Agent válido. Assim o browser não bate
 * direto no OSM (evita 403/CSP) e o mapa continua a ser o Google Maps
 * (Embed / JS) — só a lista de sugestões vem do OSM para manter custo $0.
 * Se no futuro ativar a Places API, este método pode alternar para o Google.
 */
export async function searchZones(
  query: string,
  signal?: AbortSignal,
): Promise<ZoneResult[]> {
  const q = (query || '').trim();
  if (q.length < 3) return [];
  const res = await fetch(`/api/geo/search?q=${encodeURIComponent(q)}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const err: any = new Error(`HTTP ${res.status}`);
    err.httpStatus = res.status;
    try {
      const body: any = await res.json();
      err.message = body?.error || err.message;
    } catch {
      /* ignora */
    }
    throw err;
  }
  const data: any[] = await res.json();
  return (Array.isArray(data) ? data : [])
    .map((d) => {
      const lat = Number(d?.latitude ?? d?.lat);
      const lng = Number(d?.longitude ?? d?.lon);
      if (!isFinite(lat) || !isFinite(lng)) return null;
      const display = String(d?.displayName || d?.display_name || '').trim();
      if (!display) return null;
      const name = String(d?.name || display.split(',')[0].trim() || display).trim();
      return {
        name: name || display,
        displayName: display,
        latitude: lat,
        longitude: lng,
        formattedAddress: display,
        mapsUrl: buildMapLink(lat, lng),
        source: 'osm' as const,
      } as ZoneResult;
    })
    .filter((x): x is ZoneResult => x !== null);
}

/**
 * Retry OSM: "salao arcadia" sozinho o Nominatim não acha POI —
 * tenta `${q}, Luanda` e `${q}, Luanda, Angola` antes de desistir.
 * Devolve a primeira lista não-vazia (ou []).
 */
export async function searchZonesWithRetry(
  query: string,
  signal?: AbortSignal,
): Promise<ZoneResult[]> {
  const q = (query || '').trim();
  if (q.length < 3) return [];
  const lower = q.toLowerCase();
  const hasLuanda = lower.includes('luanda');
  const hasAngola = lower.includes('angola');
  const attempts = [q];
  if (!hasLuanda) attempts.push(`${q}, Luanda`);
  if (!hasAngola) attempts.push(`${q}, Luanda, Angola`);
  let last: ZoneResult[] = [];
  for (const a of attempts) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const r = await searchZones(a, signal);
    if (r.length > 0) return r;
    last = r;
  }
  return last;
}

export interface ReverseResult {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ReverseResult | null> {
  if (!isFinite(lat) || !isFinite(lng)) return null;
  const res = await fetch(`/api/geo/reverse?lat=${lat}&lon=${lng}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const d: any = await res.json();
  if (!d || typeof d.displayName !== 'string' || !d.displayName.trim()) return null;
  const display = String(d.displayName).trim();
  const rLat = Number(d.latitude ?? d.lat ?? lat);
  const rLng = Number(d.longitude ?? d.lon ?? lng);
  const name = String(d.name || display.split(',')[0].trim() || display).trim() || display;
  return {
    name,
    displayName: display,
    latitude: isFinite(rLat) ? rLat : lat,
    longitude: isFinite(rLng) ? rLng : lng,
    formattedAddress: display,
  };
}

/**
 * Places API (New) via servidor — acha POIs pelo nome ("Salão Arcádia")
 * com coords+rating numa chamada. 501 quando o servidor não tem chave.
 */
export async function searchPlacesNew(
  query: string,
  signal?: AbortSignal,
): Promise<ZoneResult[]> {
  const q = (query || '').trim();
  if (q.length < 3) return [];
  const res = await fetch(`/api/geo/text-search?input=${encodeURIComponent(q)}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (res.status === 501) return [];
  if (!res.ok) {
    const err: any = new Error(`HTTP ${res.status}`);
    err.httpStatus = res.status;
    try {
      const body: any = await res.json();
      err.message = body?.error || err.message;
    } catch {
      /* ignora */
    }
    throw err;
  }
  const data: any[] = await res.json();
  return (Array.isArray(data) ? data : [])
    .map((d) => {
      const lat = Number(d?.latitude);
      const lng = Number(d?.longitude);
      if (!isFinite(lat) || !isFinite(lng)) return null;
      const name = String(d?.name || '').trim();
      const display = String(d?.displayName || d?.formattedAddress || name).trim();
      if (!name && !display) return null;
      const rating = typeof d?.rating === 'number' ? d.rating : null;
      const total = typeof d?.userRatingsTotal === 'number' ? d.userRatingsTotal : null;
      return {
        name: name || display.split(',')[0].trim(),
        displayName: display,
        latitude: lat,
        longitude: lng,
        formattedAddress: String(d?.formattedAddress || display || '').trim() || null,
        plusCode: typeof d?.plusCode === 'string' ? d.plusCode : null,
        rating,
        userRatingsTotal: total,
        placeId: typeof d?.placeId === 'string' ? d.placeId : null,
        mapsUrl: typeof d?.mapsUrl === 'string' && d.mapsUrl ? d.mapsUrl : buildMapLink(lat, lng),
        source: 'google' as const,
      } as ZoneResult;
    })
    .filter((x): x is ZoneResult => x !== null);
}
