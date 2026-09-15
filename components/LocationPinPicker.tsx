import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Map as GoogleMap, Marker, useApiIsLoaded, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Link2, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { MapEmbed } from './MapEmbed';
import {
  DEFAULT_CENTER,
  GOOGLE_MAPS_API_KEY,
  buildDirectionsUrl,
  buildEmbedSrc,
  buildMapLink,
  formatRating,
  hasCoords,
  isShortMapLink,
  parseCoordsFromMapUrl,
  reverseGeocode,
  searchPlacesNew,
  searchZonesWithRetry,
  type ZoneResult,
} from '../lib/maps';

export interface PinValue {
  latitude: number | null;
  longitude: number | null;
  mapLink: string;
  /** Detalhes ricos do lugar — salvos no evento para o convidado ver */
  name?: string | null;
  formattedAddress?: string | null;
  plusCode?: string | null;
  rating?: number | null;
  userRatingsTotal?: number | null;
  placeId?: string | null;
  mapsUrl?: string | null;
  placePhotoUrl?: string | null;
  locationSource?: 'google' | 'osm' | 'gps' | 'link' | 'mapa' | null;
}

interface LocationPinPickerProps {
  latitude: number | null;
  longitude: number | null;
  mapLink?: string;
  /** Zona digitada (ex: "Talatona, Luanda") — alimenta a prévia sem chave */
  zone?: string;
  /** Detalhes já salvos (ao editar) — exibem o card rico sem nova busca */
  placeName?: string | null;
  formattedAddress?: string | null;
  plusCode?: string | null;
  rating?: number | null;
  userRatingsTotal?: number | null;
  placeId?: string | null;
  mapsUrl?: string | null;
  locationSource?: 'google' | 'osm' | 'gps' | 'link' | 'mapa' | null;
  /** Sugestão de zona vinda de um resultado (o pai preenche se estiver vazio) */
  onZoneSuggest?: (name: string) => void;
  onChange: (value: PinValue) => void;
  onClear?: () => void;
  /** 'dark' = editor do convite (fundo escuro + dourado) */
  tone?: 'light' | 'dark';
}

const fmt = (n: number) => n.toFixed(5);

/**
 * Localização do evento: Google Places quando a lib já carregou (previa
 * instantânea), OSM via proxy quando não — em ambos os casos o mapa é
 * Google (Embed/JS) e o pino salvo é idêntico. Só zona + pino.
 */
export const LocationPinPicker: React.FC<LocationPinPickerProps> = ({
  latitude,
  longitude,
  mapLink,
  zone,
  placeName,
  formattedAddress,
  plusCode,
  rating,
  userRatingsTotal,
  placeId,
  mapsUrl,
  locationSource,
  onZoneSuggest,
  onChange,
  onClear,
  tone = 'light',
}) => {
  const apiLoaded = useApiIsLoaded();
  const places = useMapsLibrary('places');
  const dark = tone === 'dark';
  const canInteract = Boolean(GOOGLE_MAPS_API_KEY) && apiLoaded;
  // Google Places: só tenta quando a lib já carregou; senão cai no OSM grátis
  const googleReady = Boolean(places);
  const precise =
    hasCoords({ latitude, longitude }) &&
    latitude !== null &&
    longitude !== null;
  // Prévia 100% sem chave (só Embed API): por coords ou pela zona digitada.
  const embedSrc = buildEmbedSrc({
    latitude,
    longitude,
    locationName: (zone || '').trim(),
  });

  const [camera, setCamera] = useState(
    precise ? { lat: latitude as number, lng: longitude as number } : DEFAULT_CENTER,
  );
  const [link, setLink] = useState(mapLink || '');
  const [linkError, setLinkError] = useState('');
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  // Busca de zona (keyless) + rótulo do pino ("Entendido: …")
  const [searchText, setSearchText] = useState(zone || '');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ZoneResult[]>([]);
  const [searchError, setSearchError] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  // Detalhes ricos do pino atual — o que será salvo no evento e visto pelo convidado
  const [placeDetails, setPlaceDetails] = useState<{
    name?: string | null;
    formattedAddress?: string | null;
    plusCode?: string | null;
    rating?: number | null;
    userRatingsTotal?: number | null;
    placeId?: string | null;
    mapsUrl?: string | null;
    placePhotoUrl?: string | null;
    locationSource?: 'google' | 'osm' | 'gps' | 'link' | 'mapa' | null;
  }>(() =>
    precise
      ? {
          name: placeName || null,
          formattedAddress: formattedAddress || null,
          plusCode: plusCode || null,
          rating: typeof rating === 'number' ? rating : null,
          userRatingsTotal: typeof userRatingsTotal === 'number' ? userRatingsTotal : null,
          placeId: placeId || null,
          mapsUrl: mapsUrl || null,
          locationSource: locationSource || null,
        }
      : {},
  );
  const mapBoxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestRef = useRef(0);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const [placeNameEdit, setPlaceNameEdit] = useState(placeName || '');
  const [isResolving, setIsResolving] = useState(false);

  // Acompanha a zona vinda de fora (sem roubar o que o utilizador digita)
  useEffect(() => {
    if (document.activeElement !== searchRef.current) setSearchText(zone || '');
  }, [zone]);

  // Se o pino chegar de fora (link colado noutro sítio), recentra.
  useEffect(() => {
    if (precise) setCamera({ lat: latitude as number, lng: longitude as number });
  }, [latitude, longitude]);

  // Mantém input de nome editável sincronizado com pino salvo
  useEffect(() => {
    if (precise) setPlaceNameEdit((placeName || '').trim() || (formattedAddress || '').split(',')[0]?.trim() || '');
  }, [precise, placeName, formattedAddress]);

  const setPin = useCallback(
    (
      lat: number,
      lng: number,
      source: 'mapa' | 'link' | 'gps' | 'busca',
      label?: string,
      extra?: Partial<PinValue>,
    ) => {
      if (!isFinite(lat) || !isFinite(lng)) return;
      setCamera({ lat, lng });
      const isManual = source === 'mapa' || source === 'gps';
      setSelectedLabel(
        label ||
          (source === 'gps'
            ? 'GPS do dispositivo'
            : source === 'link'
              ? 'Link do Google Maps'
              : 'Pino manual no mapa'),
      );
      const details = {
        name: extra?.name ?? null,
        formattedAddress: extra?.formattedAddress ?? null,
        plusCode: extra?.plusCode ?? null,
        rating: typeof extra?.rating === 'number' ? extra.rating : null,
        userRatingsTotal:
          typeof extra?.userRatingsTotal === 'number' ? extra.userRatingsTotal : null,
        placeId: extra?.placeId ?? null,
        mapsUrl: extra?.mapsUrl ?? buildMapLink(lat, lng),
        placePhotoUrl: extra?.placePhotoUrl ?? null,
        locationSource: (extra?.locationSource ?? source) as PinValue['locationSource'],
      };
      // 'busca' vindo do Google/OSM usa a origem real quando informada
      if (source === 'busca' && extra?.locationSource) {
        details.locationSource = extra.locationSource;
      }
      setPlaceDetails(details);
      if (isManual && (details.name || '').trim()) setPlaceNameEdit((details.name || '').trim());
      onChange({
        latitude: lat,
        longitude: lng,
        mapLink: buildMapLink(lat, lng),
        ...details,
      });
      // Pino manual (Samba não registada): reverse Nominatim -> atualiza card/ nome sem custo Google
      if (isManual && !(extra?.name || extra?.formattedAddress)) {
        reverseAbortRef.current?.abort();
        const ctrl = new AbortController();
        reverseAbortRef.current = ctrl;
        setIsResolving(true);
        reverseGeocode(lat, lng, ctrl.signal)
          .then((rev) => {
            if (ctrl.signal.aborted) return;
            if (!rev?.displayName) return;
            const revName = (rev.name || rev.displayName.split(',')[0].trim() || '').trim();
            const revAddr = rev.formattedAddress || rev.displayName;
            const nextDetails = {
              ...details,
              name: revName || details.name,
              formattedAddress: revAddr || details.formattedAddress,
            };
            setPlaceDetails(nextDetails);
            if (revName) setPlaceNameEdit(revName);
            onChange({
              latitude: lat,
              longitude: lng,
              mapLink: buildMapLink(lat, lng),
              ...nextDetails,
            });
          })
          .catch(() => {})
          .finally(() => {
            if (!ctrl.signal.aborted) setIsResolving(false);
          });
      }
      // Feedback automático: o mapa/prévia vem até ao utilizador.
      if (source !== 'mapa') {
        requestAnimationFrame(() =>
          mapBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
        );
      }
    },
    [onChange],
  );

  // Guarda detalhes das previsões Google para não pedir coords ao escolher
  const googleDetailsRef = useRef<Map<string, ZoneResult>>(new globalThis.Map());
  const sessionTokenRef = useRef<any>(null);

  const searchGoogle = useCallback(
    async (q: string, ctrl: AbortController): Promise<ZoneResult[] | null> => {
      if (!places || ctrl.signal.aborted) return null;
      try {
        // Tenta API legada (Places API) — se foi desativada e só a New existe, lança e caímos no OSM
        if (!sessionTokenRef.current) {
          try {
            const TokenCtor: any = (places as any).AutocompleteSessionToken;
            sessionTokenRef.current = TokenCtor ? new TokenCtor() : null;
          } catch {
            sessionTokenRef.current = null;
          }
        }
        const svc = new (places as any).AutocompleteService();
        const preds: any[] = await new Promise((resolve, reject) => {
          if (ctrl.signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
          const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
          ctrl.signal.addEventListener('abort', onAbort, { once: true });
          // NOTA: API legada — usa location+radius (locationBias é da New e dá INVALID_REQUEST)
          const req: any = {
            input: q,
            language: 'pt',
            componentRestrictions: { country: 'ao' },
            location: { lat: -8.839, lng: 13.234 },
            radius: 50000,
          };
          if (sessionTokenRef.current) req.sessionToken = sessionTokenRef.current;
          svc.getPlacePredictions(
            req,
            (res: any[], status: any) => {
              ctrl.signal.removeEventListener('abort', onAbort);
              const s = String(status || '');
              if (s === 'OK' && Array.isArray(res) && res.length > 0) resolve(res);
              else if (s === 'ZERO_RESULTS' || s === 'NOT_FOUND') {
                if (typeof console !== 'undefined') console.warn('[places-legacy] zero', { q });
                resolve([]);
              } else if (s === 'OVER_QUERY_LIMIT') {
                const e: any = new Error('OVER_QUERY_LIMIT');
                e.httpStatus = 429;
                reject(e);
              } else if (s === 'REQUEST_DENIED' || s === 'INVALID_REQUEST') {
                // Places desativada / chave restrita → null faz o chamador cair no OSM
                if (typeof console !== 'undefined') console.warn('[places-legacy] denied', { q, status: s });
                reject(new Error(s || 'GOOGLE_DENIED'));
              } else {
                if (typeof console !== 'undefined') console.warn('[places-legacy] erro', { q, status: s });
                reject(new Error(s || 'GOOGLE_ERROR'));
              }
            },
          );
        });
        if (!preds || preds.length === 0) return [];
        // Resolve detalhes só do que aparece na lista (geometry) — sem bloquear a lista
        const mapped: ZoneResult[] = [];
        googleDetailsRef.current.clear();
        for (const p of preds.slice(0, 5)) {
          const pid = p.place_id;
          const main = p.structured_formatting?.main_text || p.description?.split(',')[0] || p.description || '';
          const secondary = p.structured_formatting?.secondary_text || '';
          const display = p.description || (secondary ? `${main}, ${secondary}` : main);
          // Fallback imediato: sem coords ainda, mas a lista já aparece; coords vêm no pick
          const entry: ZoneResult = {
            name: main || display.split(',')[0].trim(),
            displayName: display,
            latitude: 0,
            longitude: 0,
          };
          // Guarda placeId para buscar coords no pick
          (entry as any).__placeId = pid;
          (entry as any).__google = true;
          mapped.push(entry);
        }
        return mapped;
      } catch (e: any) {
        if (e?.name === 'AbortError') throw e;
        // Qualquer falha do Google → sinaliza null para o chamador cair no OSM
        return null;
      }
    },
    [places],
  );

  /** Junta New + legado + OSM sem duplicar o mesmo lugar (~60m). New primeiro (já tem coords). */
  const mergeZoneResults = (...lists: ZoneResult[][]): ZoneResult[] => {
    const out: ZoneResult[] = [];
    const push = (r: ZoneResult) => {
      if (out.length >= 8) return;
      const dup = out.some((e) => {
        const eHas = typeof e.latitude === 'number' && isFinite(e.latitude) && Math.abs(e.latitude) > 0.0001;
        const rHas = typeof r.latitude === 'number' && isFinite(r.latitude) && Math.abs(r.latitude) > 0.0001;
        if (eHas && rHas) {
          const dLat = Math.abs(e.latitude - r.latitude);
          const dLng = Math.abs(e.longitude - r.longitude);
          if (dLat < 0.0006 && dLng < 0.0006) return true;
        }
        const en = (e.name || '').toLowerCase().trim();
        const rn = (r.name || '').toLowerCase().trim();
        return en !== '' && en === rn;
      });
      if (!dup) out.push(r);
    };
    for (const list of lists) for (const r of (list || []).slice(0, 8)) push(r);
    return out;
  };

  const doSearch = useCallback(
    async (query: string, opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      const q = query.trim();
      if (q.length < 3) {
        if (silent) {
          setResults([]);
          return;
        }
        setSearchError('Escreva pelo menos 3 letras para pesquisar.');
        setResults([]);
        setListOpen(true);
        return;
      }
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const myRequest = ++requestRef.current;
      setSearching(true);
      setSearchError('');
      if (!silent) setListOpen(true);
      else if (results.length > 0 || listOpen) setListOpen(true);
      try {
        // Busca combinada: Places New (servidor, acha POI) + legado + OSM em paralelo.
        const newTask: Promise<ZoneResult[]> = searchPlacesNew(q, ctrl.signal).catch((e: any) => {
          if (e?.name === 'AbortError') throw e;
          if (e?.httpStatus === 429) throw e;
          if (typeof console !== 'undefined') console.warn('[places-new] fallback', { q, err: e?.message });
          return [] as ZoneResult[];
        });
        const legacyTask: Promise<ZoneResult[] | null> = googleReady
          ? searchGoogle(q, ctrl).catch((e: any) => {
              if (e?.name === 'AbortError') throw e;
              // OVER_QUERY_LIMIT propaga para mensagem dedicada; resto vira null (tenta resto)
              if (e?.httpStatus === 429 || String(e?.message || '').includes('OVER_QUERY_LIMIT')) throw e;
              return null;
            })
          : Promise.resolve(null);
        const osmTask: Promise<ZoneResult[]> = searchZonesWithRetry(q, ctrl.signal).catch((e: any) => {
          if (e?.name === 'AbortError') throw e;
          // OSM falhou — não bloqueia o Google; devolve vazio e segue
          return [] as ZoneResult[];
        });
        const [nFound, gFound, oFound] = await Promise.all([newTask, legacyTask, osmTask]);
        if (myRequest !== requestRef.current || ctrl.signal.aborted) return;
        const merged = mergeZoneResults(nFound || [], gFound || [], oFound || []);
        // Auto-fix: se Buscar explícito devolve 1 Google exato, fixa sem exigir click
        const isSingleGoogleExact =
          !silent &&
          merged.length === 1 &&
          (merged[0].source === 'google' || (merged[0] as any).__google === true) &&
          typeof merged[0].latitude === 'number' &&
          isFinite(merged[0].latitude) &&
          Math.abs(merged[0].latitude) > 0.0001;
        if (isSingleGoogleExact) {
          const r = merged[0];
          const isGoogle = (r as any).__google === true || r.source === 'google';
          setResults([]);
          setSearchError('');
          setListOpen(false);
          setSearchText(r.name);
          onZoneSuggest?.(r.name);
          sessionTokenRef.current = null;
          setPin(r.latitude, r.longitude, 'busca', r.displayName, {
            name: r.name,
            formattedAddress: r.formattedAddress || r.displayName,
            plusCode: r.plusCode || null,
            rating: typeof r.rating === 'number' ? r.rating : null,
            userRatingsTotal: typeof r.userRatingsTotal === 'number' ? r.userRatingsTotal : null,
            placeId: r.placeId || (r as any).__placeId || null,
            mapsUrl: r.mapsUrl || buildMapLink(r.latitude, r.longitude),
            placePhotoUrl: (r as any).photoUrl || null,
            locationSource: isGoogle ? 'google' : 'osm',
          });
          if (myRequest === requestRef.current) setSearching(false);
          return;
        }
        setResults(merged);
        if (merged.length === 0) {
          if (silent) {
            setSearchError('');
            setListOpen(false);
          } else {
            setSearchError(`Nada encontrado para "${q}". Tente com a cidade (ex: "Talatona, Luanda") ou cole o link do Maps.`);
            setListOpen(true);
          }
        } else {
          setSearchError('');
          setListOpen(true);
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        if (myRequest !== requestRef.current) return;
        setResults([]);
        if (silent) {
          setSearchError('');
          setListOpen(false);
        } else {
          setSearchError(
            e?.httpStatus === 429
              ? 'Muitas pesquisas seguidas. Aguarde uns segundos e toque em Buscar de novo.'
              : e?.message && !String(e.message).startsWith('HTTP')
                ? String(e.message)
                : 'Falha na pesquisa. Verifique a internet e tente de novo.',
          );
          setListOpen(true);
        }
      } finally {
        if (myRequest === requestRef.current) setSearching(false);
      }
    },
    [googleReady, listOpen, results.length, searchGoogle, onZoneSuggest, setPin],
  );

  // Sugestões ao digitar (debounce 900ms — silencioso, nunca mostra erro enquanto digita)
  useEffect(() => {
    if (!focused) return;
    const q = searchText.trim();
    if (q.length < 3) return;
    const t = setTimeout(() => doSearch(q, { silent: true }), 900);
    return () => clearTimeout(t);
  }, [searchText, focused, doSearch]);

  // Fecha a lista ao tocar fora
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setListOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const pickResult = useCallback(
    async (r: ZoneResult) => {
      const hasCoordsReady =
        typeof r.latitude === 'number' &&
        typeof r.longitude === 'number' &&
        isFinite(r.latitude) &&
        isFinite(r.longitude) &&
        (Math.abs(r.latitude) > 0.0001 || Math.abs(r.longitude) > 0.0001);
      // Places New / OSM: já traz coords+detalhes — fixa direto, sem 2ª chamada.
      if (hasCoordsReady) {
        const isGoogle = (r as any).__google === true || r.source === 'google';
        setListOpen(false);
        setResults([]);
        setSearchError('');
        setSearchText(r.name);
        onZoneSuggest?.(r.name);
        sessionTokenRef.current = null;
        setPin(r.latitude, r.longitude, 'busca', r.displayName, {
          name: r.name,
          formattedAddress: r.formattedAddress || r.displayName,
          plusCode: r.plusCode || null,
          rating: typeof r.rating === 'number' ? r.rating : null,
          userRatingsTotal: typeof r.userRatingsTotal === 'number' ? r.userRatingsTotal : null,
          placeId: r.placeId || (r as any).__placeId || null,
          mapsUrl: r.mapsUrl || buildMapLink(r.latitude, r.longitude),
          placePhotoUrl: r.photoUrl || null,
          locationSource: isGoogle ? 'google' : 'osm',
        });
        return;
      }
      const googlePlaceId = (r as any).__placeId as string | undefined;
      // Legado: a lista veio sem coords — busca detalhes agora e mostra loader na linha
      if (googlePlaceId && places) {
        setSearching(true);
        setSearchError('');
        try {
          const svc = new (places as any).PlacesService(document.createElement('div'));
          const details: any = await new Promise((resolve, reject) => {
            svc.getDetails(
              {
                placeId: googlePlaceId,
                sessionToken: sessionTokenRef.current || undefined,
                fields: [
                  'formatted_address',
                  'geometry',
                  'name',
                  'place_id',
                  'plus_code',
                  'rating',
                  'user_ratings_total',
                  'url',
                  'photos',
                ],
              },
              (p: any, status: any) => {
                const s = String(status || '');
                if (s === 'OK' && p?.geometry?.location) resolve(p);
                else reject(new Error(s || 'DETAILS_FAILED'));
              },
            );
          });
          const loc = details.geometry.location;
          const lat = typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat);
          const lng = typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng);
          if (!isFinite(lat) || !isFinite(lng)) throw new Error('NO_COORDS');
          sessionTokenRef.current = null;
          const display = details.formatted_address || details.name || r.displayName;
          const name = details.name || r.name;
          let photoUrl: string | null = null;
          try {
            const photo = Array.isArray(details.photos) ? details.photos[0] : null;
            if (photo && typeof photo.getUrl === 'function') {
              photoUrl = photo.getUrl({ maxWidth: 800 }) || null;
            }
          } catch {
            photoUrl = null;
          }
          setListOpen(false);
          setResults([]);
          setSearchError('');
          setSearchText(name);
          onZoneSuggest?.(name);
          setPin(lat, lng, 'busca', display, {
            name,
            formattedAddress: details.formatted_address || display,
            plusCode: details.plus_code?.global_code || details.plus_code?.compound_code || null,
            rating: typeof details.rating === 'number' ? details.rating : null,
            userRatingsTotal:
              typeof details.user_ratings_total === 'number' ? details.user_ratings_total : null,
            placeId: details.place_id || googlePlaceId,
            mapsUrl: details.url || buildMapLink(lat, lng),
            placePhotoUrl: photoUrl,
            locationSource: 'google',
          });
        } catch (e: any) {
          const msg = String(e?.message || '');
          if (typeof console !== 'undefined') console.warn('[places-details] falha', { placeId: googlePlaceId, status: msg });
          if (msg.includes('OVER_QUERY_LIMIT') || msg === 'OVER_QUERY_LIMIT') {
            setSearchError('Limite do Google atingido. Aguarde segundos e tente de novo.');
            setListOpen(true);
            return;
          }
          // Fallback: geocodifica o nome via OSM e fixa aproximado com nome Google.
          try {
            const fb = await searchZonesWithRetry(r.displayName || r.name, undefined);
            if (fb.length > 0) {
              const f = fb[0];
              setListOpen(false);
              setResults([]);
              setSearchError('');
              setSearchText(r.name);
              onZoneSuggest?.(r.name);
              sessionTokenRef.current = null;
              setPin(f.latitude, f.longitude, 'busca', `${r.name} (aprox.)`, {
                name: r.name,
                formattedAddress: f.displayName,
                plusCode: null,
                rating: null,
                userRatingsTotal: null,
                placeId: googlePlaceId,
                mapsUrl: buildMapLink(f.latitude, f.longitude),
                placePhotoUrl: null,
                locationSource: 'osm',
              });
              return;
            }
          } catch {
            /* ignora, mostra erro abaixo */
          }
          if (msg === 'REQUEST_DENIED') {
            setSearchError('Google bloqueou (chave/billing). Use o link do Maps ou o GPS.');
          } else if (msg === 'NOT_FOUND' || msg === 'INVALID_REQUEST') {
            setSearchError('Esse lugar expirou na lista. Busque de novo e escolha outro.');
          } else {
            setSearchError('Não foi possível ler esse local. Escolha outro da lista.');
          }
          setListOpen(true);
        } finally {
          setSearching(false);
        }
        return;
      }
      // OSM: coords já vêm na lista
      setListOpen(false);
      setResults([]);
      setSearchError('');
      setSearchText(r.name);
      onZoneSuggest?.(r.name);
      setPin(r.latitude, r.longitude, 'busca', r.displayName, {
        name: r.name,
        formattedAddress: r.formattedAddress || r.displayName,
        plusCode: r.plusCode || null,
        rating: typeof r.rating === 'number' ? r.rating : null,
        userRatingsTotal: typeof r.userRatingsTotal === 'number' ? r.userRatingsTotal : null,
        placeId: r.placeId || null,
        mapsUrl: r.mapsUrl || buildMapLink(r.latitude, r.longitude),
        placePhotoUrl: r.photoUrl || null,
        locationSource: 'osm',
      });
    },
    [onZoneSuggest, places, setPin],
  );

  const applyLink = useCallback(() => {
    const parsed = parseCoordsFromMapUrl(link);
    if (parsed) {
      setLinkError('');
      setLink(parsed.mapLink);
      setPin(parsed.latitude, parsed.longitude, 'link', 'Link do Google Maps', {
        mapsUrl: parsed.mapLink,
        locationSource: 'link',
      });
      return;
    }
    setLinkError(
      isShortMapLink(link)
        ? 'Esse é um link curto — abra-o no Google Maps, toque em Partilhar e cole o link completo (com @ ou query=).'
        : 'Não encontrei coordenadas nesse link. Cole o link completo de Partilhar do Google Maps.',
    );
  }, [link, setPin]);

  const useGps = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Este dispositivo não suporta GPS no navegador.');
      return;
    }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setPin(pos.coords.latitude, pos.coords.longitude, 'gps', 'GPS do dispositivo', {
          locationSource: 'gps',
          mapsUrl: buildMapLink(pos.coords.latitude, pos.coords.longitude),
        });
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'GPS bloqueado — permita o acesso à localização ou fixe o pino manualmente.'
            : 'Não foi possível obter o GPS. Fixe o pino manualmente.',
        );
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, [setPin]);

  const clear = () => {
    setLink('');
    setLinkError('');
    setSelectedLabel('');
    setPlaceDetails({});
    onClear?.();
  };

  const panel = dark
    ? 'bg-[#0F1419] border-[#BF9B30]/20'
    : 'bg-white border-slate-200';
  const label = dark ? 'text-gray-400' : 'text-slate-500';
  const input = dark
    ? 'bg-[#0F1419] border-[#BF9B30]/20 text-white focus:border-[#BF9B30]'
    : 'bg-white border-slate-200 text-slate-900 focus:border-[#C5A028]';

  return (
    <div className="space-y-3">
      {/* Pesquisa de zona (Google quando disponível, OSM grátis como fallback) com loader honesto */}
      <div ref={boxRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              ref={searchRef}
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setSearchError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  doSearch(searchText, { silent: false });
                }
              }}
              onFocus={() => {
                setFocused(true);
                if (results.length > 0 || searchError) setListOpen(true);
              }}
              onBlur={() => setFocused(false)}
              placeholder="Pesquise o local — ex: Salão Arcádia, Luanda"
              autoComplete="off"
              enterKeyHint="search"
              role="combobox"
              aria-expanded={listOpen}
              aria-label="Pesquisar local do evento"
              className={`w-full border rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C5A028]/20 min-h-[48px] ${input}`}
            />
          </div>
          <button
            type="button"
            onClick={() => doSearch(searchText, { silent: false })}
            disabled={searching}
            title="Pesquisar local"
            aria-live="polite"
            className="shrink-0 min-h-[48px] min-w-[48px] px-5 rounded-xl font-bold bg-[#1B365D] text-white hover:bg-[#224373] disabled:opacity-60 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
          >
            {searching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            <span className="hidden sm:inline">{searching ? 'A buscar…' : 'Buscar'}</span>
          </button>
        </div>

        {listOpen && (searching || results.length > 0 || searchError) && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
            {searching && (
              <div className="p-4 space-y-2" aria-live="polite" aria-label="A pesquisar zona">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            )}
            {!searching && results.length > 0 && (
              <>
                <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100" role="listbox" aria-label="Sugestões de zona">
                  {results.map((r, i) => (
                    <li key={`${r.latitude},${r.longitude},${i}`} role="option" aria-selected="false">
                      <button
                        type="button"
                        onClick={() => pickResult(r)}
                        className="w-full text-left px-4 py-3 hover:bg-[#C5A028]/10 active:bg-[#C5A028]/20 transition-colors flex items-start gap-3 min-h-[56px] cursor-pointer"
                      >
                        <MapPin size={16} className="text-[#8a6d1c] shrink-0 mt-1" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-slate-800 truncate">
                            {r.name}
                            {typeof r.rating === 'number' ? (
                              <span className="ml-2 text-xs font-bold text-amber-700">★ {r.rating.toFixed(1).replace('.', ',')}</span>
                            ) : null}
                          </span>
                          <span className="block text-xs text-slate-500 truncate">
                            {r.displayName}
                          </span>
                        </span>
                        {r.source === 'google' ? (
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 mt-1">Google</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="px-4 py-1.5 text-[10px] text-slate-400 border-t border-slate-100">
                  {results.some((x) => x.source === 'google') && results.some((x) => x.source === 'osm')
                    ? 'Resultados Google + © OpenStreetMap contributors'
                    : results.some((x) => x.source === 'google')
                      ? 'Resultados Google'
                      : 'Resultados © OpenStreetMap contributors'}
                </p>
              </>
            )}
            {!searching && results.length === 0 && searchError && (
              <div className="px-4 py-3.5">
                <p className="text-xs text-slate-500 leading-relaxed">{searchError}</p>
                {!GOOGLE_MAPS_API_KEY ? (
                  <p className="text-[11px] text-amber-600 mt-1 leading-relaxed">
                    Google Places sem chave neste ambiente — a lista é só OSM. Para POIs, cole o link do Maps ou use o GPS.
                  </p>
                ) : !places ? (
                  <p className="text-[11px] text-amber-600 mt-1 leading-relaxed">
                    Google Places a carregar/bloqueado (chave/referrer/billing) — a lista é só OSM. Abra o Console (F12) e veja [places-*].
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    A prévia abaixo é do Google e acha pelo nome — o Buscar precisa da cidade. Ex: “{searchText.trim()}{searchText.trim().toLowerCase().includes('luanda') ? '' : ', Luanda'}”.
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {!searchText.trim().toLowerCase().includes('luanda') ? (
                    <button
                      type="button"
                      onClick={() => {
                        const withCity = `${searchText.trim()}, Luanda`;
                        setSearchText(withCity);
                        doSearch(withCity, { silent: false });
                      }}
                      className="min-h-[44px] px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider text-white bg-[#1B365D] hover:bg-[#224373] cursor-pointer"
                    >
                      Buscar com Luanda
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => doSearch(searchText, { silent: false })}
                    className="min-h-[44px] px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider text-[#1B365D] bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    Tentar de novo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={mapBoxRef} className="relative w-full overflow-hidden rounded-2xl border border-black/10 shadow-lg bg-slate-100 aspect-[16/10] min-h-[220px] scroll-mt-4">
        {canInteract ? (
          <GoogleMap
            center={camera}
            onCameraChanged={(e) => setCamera(e.detail.center)}
            defaultZoom={15}
            gestureHandling="cooperative"
            disableDefaultUI
            zoomControl
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={false}
            onClick={(e) => {
              const ll = e.detail.latLng;
              if (ll) setPin(ll.lat, ll.lng, 'mapa', 'Pino manual no mapa', { locationSource: 'mapa' });
            }}
            className="absolute inset-0 h-full w-full"
          >
            {precise ? (
              <Marker
                position={{ lat: latitude as number, lng: longitude as number }}
                draggable
                onDragEnd={(e) => {
                  const ll = e.latLng;
                  if (ll) setPin(ll.lat(), ll.lng(), 'mapa', 'Pino manual no mapa', { locationSource: 'mapa' });
                }}
              />
            ) : null}
          </GoogleMap>
        ) : embedSrc ? (
          <>
            <MapEmbed src={embedSrc} title={`Prévia: ${(zone || '').trim() || 'local do evento'}`} />
            {!precise ? (
              <p className="absolute left-3 right-3 bottom-3 rounded-xl bg-slate-900/80 text-white text-[11px] font-medium px-3 py-2 text-center backdrop-blur">
                Prévia aproximada pela zona — cole o link ou use o GPS para fixar o pino exato.
              </p>
            ) : null}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 p-6 text-center">
            <MapPin size={32} />
            <p className="text-sm font-medium">
              Pesquise o local acima para fixar o pino — ou cole o link do Google Maps ou use o GPS.
            </p>
          </div>
        )}
      </div>

      {precise ? (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl px-4 py-3 space-y-2.5">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                Local selecionado ✓ {placeDetails.locationSource === 'google' ? '· Google' : placeDetails.locationSource === 'osm' ? '· OpenStreetMap' : placeDetails.locationSource ? `· ${placeDetails.locationSource.toUpperCase()}` : ''} {isResolving ? '· A resolver endereço…' : ''}
              </p>
              {selectedLabel ? (
                <p className="text-sm font-bold text-slate-800 leading-snug">
                  {placeDetails.name && placeDetails.name !== selectedLabel ? `${placeDetails.name} — ` : ''}{selectedLabel}
                </p>
              ) : placeDetails.name ? (
                <p className="text-sm font-bold text-slate-800 leading-snug">{placeDetails.name}</p>
              ) : null}
              {placeDetails.formattedAddress && placeDetails.formattedAddress !== selectedLabel ? (
                <p className="text-xs text-slate-600 truncate">{placeDetails.formattedAddress}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                {formatRating(placeDetails.rating, placeDetails.userRatingsTotal) ? (
                  <span className="text-xs font-bold text-amber-700">
                    {formatRating(placeDetails.rating, placeDetails.userRatingsTotal)}
                  </span>
                ) : null}
                {placeDetails.plusCode ? (
                  <span className="text-[11px] font-mono bg-white border border-emerald-200 rounded px-1.5 py-0.5 text-slate-600">
                    {placeDetails.plusCode}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {fmt(latitude as number)}, {fmt(longitude as number)} — os convidados veem exatamente onde é.
              </p>
              {placeDetails.mapsUrl && placeDetails.mapsUrl !== buildMapLink(latitude as number, longitude as number) ? (
                <a
                  href={placeDetails.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-[#1B365D] underline mt-1 inline-block"
                >
                  Ver página do lugar no Google Maps
                </a>
              ) : null}
            </div>
            <button
              type="button"
              onClick={clear}
              className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-red-500 hover:underline uppercase tracking-wider cursor-pointer min-h-[32px] min-w-[44px] justify-center"
            >
              <X size={12} /> Remover
            </button>
          </div>
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1">Nome do local (editável) *</span>
            <input
              type="text"
              value={placeNameEdit}
              onChange={(e) => {
                const v = e.target.value;
                setPlaceNameEdit(v);
                const next = { ...placeDetails, name: v.trim() || placeDetails.name, formattedAddress: placeDetails.formattedAddress };
                // mantém card vivo enquanto digita
                setPlaceDetails((prev) => ({ ...prev, name: v.trim() || prev.name || null }));
                onChange({
                  latitude: latitude as number,
                  longitude: longitude as number,
                  mapLink: buildMapLink(latitude as number, longitude as number),
                  ...next,
                  name: v.trim() || next.name || null,
                } as PinValue);
                if (v.trim()) onZoneSuggest?.(v.trim());
              }}
              placeholder="Ex: Quintal da Família, Samba"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 ${dark ? 'bg-[#0F1419] border-[#BF9B30]/20 text-white placeholder:text-gray-500 focus:border-[#BF9B30]' : 'bg-white border-emerald-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400'}`}
            />
            <span className="block text-[10px] text-emerald-700/70 mt-1">Muda com o pino (reverse). Podes corrigir para o nome real do espaço — o convidado vê isto.</span>
          </label>
        </div>
      ) : (
        <p className={`text-[11px] font-medium ${label}`}>
          {GOOGLE_MAPS_API_KEY
            ? 'Sem pino — toque no mapa, cole o link ou use o GPS. Só a zona é pedida, sem endereço.'
            : 'Sem pino — cole o link do Google Maps ou use o GPS. Só a zona é pedida, sem endereço.'}
        </p>
      )}

      <div className={`rounded-2xl border p-3.5 space-y-2.5 ${panel}`}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="url"
              inputMode="url"
              autoComplete="off"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setLinkError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                }
              }}
              placeholder="…ou cole o link do Google Maps"
              className={`w-full border rounded-xl pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C5A028]/20 min-h-[48px] ${input}`}
            />
          </div>
          <button
            type="button"
            onClick={applyLink}
            disabled={!link.trim()}
            className="shrink-0 min-h-[48px] min-w-[48px] px-4 rounded-xl font-bold bg-[#1B365D] text-white hover:bg-[#224373] disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer"
          >
            Fixar
          </button>
        </div>
        {linkError ? <p className="text-xs text-amber-600 leading-relaxed">{linkError}</p> : null}
        <button
          type="button"
          onClick={useGps}
          disabled={locating}
          className={`w-full min-h-[48px] rounded-xl border text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 ${
            dark
              ? 'border-[#BF9B30]/30 text-[#BF9B30] hover:bg-[#BF9B30]/10'
              : 'border-slate-200 text-[#1B365D] hover:bg-slate-50'
          }`}
        >
          {locating ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
          {locating ? 'A localizar…' : 'Usar a minha localização (GPS)'}
        </button>
        {geoError ? <p className="text-xs text-amber-600 leading-relaxed">{geoError}</p> : null}
      </div>
    </div>
  );
};
