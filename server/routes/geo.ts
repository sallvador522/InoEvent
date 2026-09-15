/**
 * Geo Proxy — pesquisa de zona sem chave no browser + Places New no servidor.
 *
 *  - GET /api/geo/search → Nominatim (OpenStreetMap), grátis, sem chave.
 *  - GET /api/geo/text-search?input= → Places API (New) Text Search, acha POIs
 *    como o iframe ("Salão de Festas Arcádia") com coords+rating numa chamada.
 *    Usa GOOGLE_MAPS_PLATFORM_KEY se existir, senão reutiliza VITE_GOOGLE_MAPS_API_KEY (single-key).
 */
import { Router } from 'express';
import { logger } from '../../lib/logger.js';

const router = Router();

// Simples rate-limit em memória por IP: 1 req/s (separado por rota)
const lastHitSearch = new Map<string, number>();
const lastHitText = new Map<string, number>();
const lastHitReverse = new Map<string, number>();

function checkRate(map: Map<string, number>, ip: string): boolean {
  const now = Date.now();
  const prev = map.get(ip) || 0;
  if (now - prev < 900) return false;
  map.set(ip, now);
  return true;
}

router.get('/api/geo/search', async (req, res) => {
  const ip = (req.ip || req.headers['x-forwarded-for'] as string || 'unknown').toString();
  if (!checkRate(lastHitSearch, ip)) {
    return res.status(429).json({ error: 'Muitas pesquisas seguidas. Aguarde um segundo.' });
  }

  const raw = String(req.query.q || '').trim();
  if (raw.length < 3) return res.json([]);
  if (raw.length > 120) return res.status(400).json({ error: 'Pesquisa muito longa.' });

  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '8',
    addressdetails: '0',
    'accept-language': 'pt',
    countrycodes: 'ao',
    viewbox: '11.6,-4.4,24.1,-18.0',
    bounded: '0',
    q: raw,
  });

  try {
    const upstream = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'InoEvent/1.0 (https://www.inoevent.online; contacto@inoevent.online)',
        'Referer': 'https://www.inoevent.online/',
        'Accept': 'application/json',
        'Accept-Language': 'pt',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      const body = await upstream.text().catch(() => '');
      logger.warn(`Geo proxy upstream ${upstream.status}: ${body.slice(0, 200)}`, { category: 'SYSTEM' });
      // Propaga 429/5xx de forma amigável
      if (upstream.status === 429) {
        return res.status(429).json({ error: 'Serviço de zonas ocupado. Tente de novo em segundos.' });
      }
      return res.status(502).json({ error: 'Serviço de zonas indisponível. Tente de novo.' });
    }

    const data: any[] = await upstream.json();
    const out = (Array.isArray(data) ? data : [])
      .map((d) => {
        const lat = Number(d?.lat);
        const lng = Number(d?.lon);
        if (!isFinite(lat) || !isFinite(lng)) return null;
        const display = String(d?.display_name || '').trim();
        if (!display) return null;
        return {
          name: display.split(',')[0].trim() || display,
          displayName: display,
          latitude: lat,
          longitude: lng,
        };
      })
      .filter((x): x is any => x !== null);

    return res.json(out);
  } catch (e: any) {
    if (e?.name === 'AbortError' || e?.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Tempo esgotado ao pesquisar a zona.' });
    }
    logger.error('Geo proxy erro', { category: 'SYSTEM', data: e?.message || String(e) });
    return res.status(502).json({ error: 'Falha ao pesquisar a zona. Verifique a internet e tente de novo.' });
  }
});

// --- Places API (New) Text Search — acha POIs pelo nome, como o iframe ---
// Single-key: usa GOOGLE_MAPS_PLATFORM_KEY se existir, senão reutiliza VITE_GOOGLE_MAPS_API_KEY
router.get('/api/geo/text-search', async (req, res) => {
  const ip = (req.ip || req.headers['x-forwarded-for'] as string || 'unknown').toString();
  if (!checkRate(lastHitText, ip)) {
    return res.status(429).json({ error: 'Muitas pesquisas seguidas. Aguarde um segundo.' });
  }

  const raw = String(req.query.input || req.query.q || '').trim();
  if (raw.length < 3) return res.json([]);
  if (raw.length > 120) return res.status(400).json({ error: 'Pesquisa muito longa.' });

  const serverKey = (
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    ''
  ).trim();
  if (!serverKey) {
    return res.status(501).json({ error: 'Places New não configurado no servidor.' });
  }

  try {
    const upstream = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': serverKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.plusCode',
        // Single-key é restrita por HTTP referrer -> o Google bloqueia referer <empty> no servidor.
        // Enviamos um referer válido coberto pela lista (www.inoevent.online/*).
        Referer: 'https://www.inoevent.online/',
        Origin: 'https://www.inoevent.online',
      },
      body: JSON.stringify({
        textQuery: raw,
        languageCode: 'pt',
        regionCode: 'AO',
        locationBias: {
          circle: { center: { latitude: -8.839, longitude: 13.234 }, radius: 50000.0 },
        },
        maxResultCount: 8,
      }),
      signal: AbortSignal.timeout(9000),
    });

    if (!upstream.ok) {
      const body = await upstream.text().catch(() => '');
      logger.warn(`Places New text-search ${upstream.status}: ${body.slice(0, 300)}`, { category: 'SYSTEM' });
      if (upstream.status === 429) {
        return res.status(429).json({ error: 'Serviço Google ocupado. Tente de novo em segundos.' });
      }
      return res.status(502).json({ error: 'Serviço Google indisponível. Tente de novo.' });
    }

    const data: any = await upstream.json();
    const out = (Array.isArray(data?.places) ? data.places : [])
      .map((p: any) => {
        const lat = Number(p?.location?.latitude);
        const lng = Number(p?.location?.longitude);
        if (!isFinite(lat) || !isFinite(lng)) return null;
        const name = String(p?.displayName?.text || '').trim();
        const formatted = String(p?.formattedAddress || '').trim();
        if (!name && !formatted) return null;
        const rating = typeof p?.rating === 'number' ? p.rating : null;
        const total = typeof p?.userRatingCount === 'number' ? p.userRatingCount : null;
        const plus =
          String(p?.plusCode?.globalCode || p?.plusCode?.global_code || p?.plusCode?.compoundCode || '').trim() || null;
        return {
          name: name || formatted.split(',')[0].trim(),
          displayName: formatted || name,
          latitude: lat,
          longitude: lng,
          formattedAddress: formatted || null,
          plusCode: plus,
          rating,
          userRatingsTotal: total,
          placeId: String(p?.id || '').trim() || null,
          mapsUrl: String(p?.googleMapsUri || '').trim() || null,
          source: 'google',
        };
      })
      .filter((x: any) => x !== null);

    return res.json(out);
  } catch (e: any) {
    if (e?.name === 'AbortError' || e?.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Tempo esgotado na pesquisa Google.' });
    }
    logger.error('Places New text-search erro', { category: 'SYSTEM', data: e?.message || String(e) });
    return res.status(502).json({ error: 'Falha na pesquisa Google. Tente de novo.' });
  }
});

// --- Reverse geocode (Nominatim, grátis) -> nome/endereço do pino manual ---
router.get('/api/geo/reverse', async (req, res) => {
  const ip = (req.ip || req.headers['x-forwarded-for'] as string || 'unknown').toString();
  if (!checkRate(lastHitReverse, ip)) {
    return res.status(429).json({ error: 'Muitas pesquisas seguidas. Aguarde um segundo.' });
  }
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon ?? req.query.lng);
  if (!isFinite(lat) || !isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ error: 'Coordenadas inválidas.' });
  }
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lon),
    zoom: '18',
    addressdetails: '0',
    'accept-language': 'pt',
  });
  try {
    const upstream = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        'User-Agent': 'InoEvent/1.0 (https://www.inoevent.online; contacto@inoevent.online)',
        Referer: 'https://www.inoevent.online/',
        Accept: 'application/json',
        'Accept-Language': 'pt',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) {
      const body = await upstream.text().catch(() => '');
      logger.warn(`Geo reverse upstream ${upstream.status}: ${body.slice(0, 200)}`, { category: 'SYSTEM' });
      if (upstream.status === 429) return res.status(429).json({ error: 'Serviço ocupado. Tente de novo.' });
      return res.status(502).json({ error: 'Serviço indisponível.' });
    }
    const data: any = await upstream.json();
    const display = String(data?.display_name || '').trim();
    if (!display) return res.json({ name: '', displayName: '', latitude: lat, longitude: lon, formattedAddress: '' });
    const rLat = Number(data?.lat);
    const rLng = Number(data?.lon);
    return res.json({
      name: display.split(',')[0].trim() || display,
      displayName: display,
      latitude: isFinite(rLat) ? rLat : lat,
      longitude: isFinite(rLng) ? rLng : lon,
      formattedAddress: display,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError' || e?.name === 'TimeoutError') return res.status(504).json({ error: 'Tempo esgotado.' });
    logger.error('Geo reverse erro', { category: 'SYSTEM', data: e?.message || String(e) });
    return res.status(502).json({ error: 'Falha no reverse.' });
  }
});

export default router;
