import React, { useCallback, useEffect, useRef, useState } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import {
  GOOGLE_MAPS_API_KEY,
  PLACES_LIBRARIES,
  buildMapLink,
  type PlaceSelection,
} from '../lib/maps';

export interface SelectedPlace extends PlaceSelection {
  rating?: number;
  reviewsCount?: number;
}

interface PlacePickerProps {
  onSelect: (place: PlaceSelection) => void;
  /** Chamado ao remover a seleção pelo cartão (limpa pino no formulário) */
  onClear?: () => void;
  placeholder?: string;
  defaultValue?: string;
  /** Controlado: o próprio campo vira a busca (ex: "Local da cerimónia") */
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
  inputClassName?: string;
}

interface Prediction {
  placeId: string;
  main: string;
  secondary: string;
}

const statusMessage = (status: unknown, query: string): string | null => {
  const s = String(status || '');
  if (s === 'OK') return null;
  if (s === 'ZERO_RESULTS' || s === 'NOT_FOUND') {
    return `Nenhum local encontrado para "${query}". Tente com a cidade (ex: "Salão Arcádia Luanda") ou preencha os campos manualmente.`;
  }
  if (s === 'REQUEST_DENIED' || s === 'INVALID_REQUEST') {
    return 'Busca bloqueada pela configuração da chave Google (API ou restrição). Avise o suporte ou preencha manualmente.';
  }
  if (s === 'OVER_QUERY_LIMIT') {
    return 'Limite de buscas do Google atingido. Aguarde alguns segundos e tente de novo.';
  }
  return 'Falha na busca. Verifique a internet e tente de novo.';
};

const SearchBox: React.FC<PlacePickerProps> = ({
  onSelect,
  onClear,
  placeholder,
  defaultValue,
  value,
  onChange,
  id,
  inputClassName,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;

  const [text, setText] = useState(defaultValue || '');
  const current = value !== undefined ? value : text;
  const setCurrent = (v: string) => {
    if (value !== undefined) onChange?.(v);
    else setText(v);
  };

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [results, setResults] = useState<Prediction[]>([]);
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const sessionRef = useRef<any>(null);
  const requestRef = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // Cartão some se o texto divergir do selecionado (pino invalidado)
  useEffect(() => {
    if (selected && current !== selected.name) setSelected(null);
  }, [current, selected]);

  // Fecha a lista ao clicar fora
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const doSearch = useCallback(
    (query: string) => {
      const q = query.trim();
      if (q.length < 3) {
        if (q.length > 0) {
          setError('Escreva pelo menos 3 letras para buscar.');
          setResults([]);
          setOpen(true);
        }
        return;
      }
      if (!places) {
        setError(
          apiError ||
            'Motor de busca ainda a carregar. Aguarde alguns segundos e toque em Buscar de novo.',
        );
        setResults([]);
        setOpen(true);
        return;
      }
      const myRequest = ++requestRef.current;
      setSearching(true);
      setError('');
      setOpen(true);
      try {
        if (!sessionRef.current) {
          sessionRef.current = new places.AutocompleteSessionToken();
        }
        const svc = new places.AutocompleteService();
        svc.getPlacePredictions(
          { input: q, sessionToken: sessionRef.current },
          (preds, status) => {
            if (myRequest !== requestRef.current) return; // resposta velha
            setSearching(false);
            const msg = statusMessage(status, q);
            if (msg || !preds || preds.length === 0) {
              setResults([]);
              setError(
                msg ||
                  `Nenhum local encontrado para "${q}". Tente com a cidade ou preencha manualmente.`,
              );
              return;
            }
            setResults(
              preds.slice(0, 5).map((p: any) => ({
                placeId: p.place_id,
                main:
                  p.structured_formatting?.main_text || p.description || '',
                secondary: p.structured_formatting?.secondary_text || '',
              })),
            );
          },
        );
      } catch {
        setSearching(false);
        setError('Falha na busca. Verifique a internet e tente de novo.');
      }
    },
    [places, apiError],
  );

  // Sugestões ao digitar (debounce) — só com foco, sem disparar no mount
  useEffect(() => {
    if (!focused) return;
    const q = current.trim();
    if (q.length < 3 || selected) return;
    const t = setTimeout(() => doSearch(q), 450);
    return () => clearTimeout(t);
  }, [current, focused, selected, doSearch]);

  const pick = useCallback(
    (placeId: string) => {
      if (!places) {
        setError('Motor de busca ainda a carregar. Tente de novo.');
        return;
      }
      setLoadingDetails(placeId);
      setError('');
      try {
        const svc = new places.PlacesService(document.createElement('div'));
        svc.getDetails(
          {
            placeId,
            sessionToken: sessionRef.current || undefined,
            fields: [
              'formatted_address',
              'geometry',
              'place_id',
              'name',
              'rating',
              'user_ratings_total',
            ],
          },
          (p: any, status: any) => {
            setLoadingDetails(null);
            const msg = statusMessage(status, '');
            const loc = p?.geometry?.location;
            if (msg || !loc) {
              setError(
                msg ||
                  'Não foi possível ler os dados desse local. Escolha outro da lista.',
              );
              return;
            }
            const lat = loc.lat();
            const lng = loc.lng();
            if (!isFinite(lat) || !isFinite(lng)) {
              setError('Local sem coordenadas. Escolha outro da lista.');
              return;
            }
            const data: SelectedPlace = {
              name: p.name || '',
              address: p.formatted_address || p.name || '',
              latitude: lat,
              longitude: lng,
              placeId: p.place_id,
              mapLink: buildMapLink(lat, lng),
              rating:
                typeof p.rating === 'number' ? p.rating : undefined,
              reviewsCount:
                typeof p.user_ratings_total === 'number'
                  ? p.user_ratings_total
                  : undefined,
            };
            sessionRef.current = null;
            setOpen(false);
            setResults([]);
            if (value === undefined) setText(data.name);
            setSelected(data);
            onSelectRef.current(data);
          },
        );
      } catch {
        setLoadingDetails(null);
        setError('Falha ao ler o local. Tente de novo.');
      }
    },
    [places, value],
  );

  const clearSelection = () => {
    setSelected(null);
    setResults([]);
    setError('');
    onClearRef.current?.();
    inputRef.current?.focus();
  };

  // Enter = buscar (igual ao botão)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch(current);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            id={id}
            ref={inputRef}
            type="text"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              setError('');
            }}
            onKeyDown={onKeyDown}
            onFocus={() => {
              setFocused(true);
              if (results.length > 0) setOpen(true);
            }}
            onBlur={() => setFocused(false)}
            placeholder={placeholder || 'Pesquise o salão, igreja ou espaço…'}
            autoComplete="off"
            enterKeyHint="search"
            className={
              inputClassName ||
              'w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-slate-900 outline-none focus:border-[#C5A028] focus:ring-2 focus:ring-[#C5A028]/20 font-light min-h-[48px]'
            }
          />
        </div>
        <button
          type="button"
          onClick={() => doSearch(current)}
          disabled={searching}
          title="Buscar local no mapa"
          className="shrink-0 min-h-[48px] min-w-[48px] px-5 rounded-xl font-bold bg-[#1B365D] text-white hover:bg-[#224373] disabled:opacity-60 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
          style={{ transition: 'background-color 200ms ease' }}
        >
          {searching ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
          <span className="hidden sm:inline">Buscar</span>
        </button>
      </div>

      {open && (searching || results.length > 0 || error) && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
          {searching && (
            <div className="p-4 space-y-2" aria-live="polite">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          )}
          {!searching && results.length > 0 && (
            <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {results.map((r) => (
                <li key={r.placeId}>
                  <button
                    type="button"
                    onClick={() => pick(r.placeId)}
                    disabled={loadingDetails !== null}
                    className="w-full text-left px-4 py-3 hover:bg-[#C5A028]/10 active:bg-[#C5A028]/20 transition-colors flex items-start gap-3 min-h-[56px] cursor-pointer disabled:opacity-60"
                  >
                    <MapPin
                      size={16}
                      className="text-[#8a6d1c] shrink-0 mt-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-800 truncate">
                        {r.main}
                      </span>
                      {r.secondary ? (
                        <span className="block text-xs text-slate-500 truncate">
                          {r.secondary}
                        </span>
                      ) : null}
                    </span>
                    {loadingDetails === r.placeId ? (
                      <Loader2
                        size={16}
                        className="animate-spin text-[#8a6d1c] shrink-0 mt-1"
                      />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!searching && results.length === 0 && error && (
            <p className="px-4 py-3.5 text-xs text-slate-500 leading-relaxed">
              {error}
            </p>
          )}
        </div>
      )}

      {selected && (
        <div className="mt-2 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              Local selecionado
            </p>
            <p className="text-sm font-bold text-slate-800 truncate">
              {selected.name}
            </p>
            {selected.address ? (
              <p className="text-xs text-slate-500 truncate">
                {selected.address}
              </p>
            ) : null}
            {typeof selected.rating === 'number' && (
              <p className="text-xs font-bold text-amber-600 mt-0.5">
                ★ {selected.rating.toFixed(1)}
                {typeof selected.reviewsCount === 'number'
                  ? ` (${selected.reviewsCount} avaliações)`
                  : ''}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                if (results.length === 0) doSearch(current);
                inputRef.current?.focus();
              }}
              className="text-[11px] font-bold text-[#1B365D] hover:underline uppercase tracking-wider cursor-pointer min-h-[32px]"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[11px] font-bold text-red-500 hover:underline uppercase tracking-wider cursor-pointer min-h-[32px]"
            >
              Remover
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Busca de locais (Google Places) com botão + Enter + sugestões + cartão rico.
 * Sem chave, rende null e o fluxo cai para os campos manuais.
 */
export const PlacePicker: React.FC<PlacePickerProps> = (props) => {
  const [apiError, setApiError] = useState('');
  if (!GOOGLE_MAPS_API_KEY) {
    // Só em dev: avisa que falta a chave (em produção, cai em silêncio p/ manual)
    if ((import.meta as any)?.env?.DEV) {
      return (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 leading-relaxed">
          Busca Google desativada: falta <code>VITE_GOOGLE_MAPS_API_KEY</code> no
          .env — reinicie o servidor após adicionar.
        </p>
      );
    }
    return null;
  }
  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={PLACES_LIBRARIES}
      onError={() =>
        setApiError(
          'Não foi possível carregar o motor de busca do Google (chave, rede ou restrição). Preencha os campos manualmente.',
        )
      }
    >
      {apiError ? (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 leading-relaxed">
          {apiError}
        </p>
      ) : (
        <SearchBox {...props} />
      )}
    </APIProvider>
  );
};
