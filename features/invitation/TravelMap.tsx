import React, { useEffect, useState } from 'react';
import {
  APIProvider,
  Map,
  Marker,
  useApiIsLoaded,
} from '@vis.gl/react-google-maps';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Map as MapIcon, ExternalLink, Copy, Check, Search } from 'lucide-react';
import { InlineText } from '../../components/InlineEdit';
import { copyToClipboard } from '../../lib/clipboard';
import {
  GOOGLE_MAPS_API_KEY,
  buildEmbedSrc,
  hasCoords,
} from '../../lib/maps';

const getValidMapUrl = (link?: string, fallbackQuery?: string) => {
  if (!link || typeof link !== 'string') {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery || 'Local do Evento')}`;
  }
  const cleanLink = link.trim();
  if (cleanLink === '#' || cleanLink === '' || cleanLink.startsWith('/')) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery || 'Local do Evento')}`;
  }
  if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
    return cleanLink;
  }
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(cleanLink)) {
    return `https://${cleanLink}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery || cleanLink)}`;
};

const MapFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative w-full overflow-hidden rounded-2xl border border-black/10 shadow-lg bg-slate-100 aspect-[16/10] min-h-[220px]">
    {children}
  </div>
);

const JsMap: React.FC<{ lat: number; lng: number; title: string }> = ({
  lat,
  lng,
  title,
}) => {
  const loaded = useApiIsLoaded();
  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
      <Map
        defaultCenter={{ lat, lng }}
        defaultZoom={15}
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
        className="absolute inset-0 h-full w-full"
      >
        <Marker position={{ lat, lng }} title={title} />
      </Map>
    </>
  );
};

const EmbedMap: React.FC<{ src: string; title: string }> = ({ src, title }) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
  }, [src]);
  return (
    <>
      {loading && <Skeleton className="absolute inset-0 rounded-none" />}
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allowFullScreen
        onLoad={() => setLoading(false)}
        className="absolute inset-0 h-full w-full border-0"
      />
    </>
  );
};

/** Anti-tremor: o mapa só reage 600ms após parar de digitar */
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export const TravelMap: React.FC<{
  event: any;
  isEditing?: boolean;
  onFieldChange?: (field: string, value: any) => void;
  /** 'full' = mapa + título + botões · 'map-only' = só o mapa (temas que já têm os seus) */
  chrome?: 'full' | 'map-only';
}> = ({ event, isEditing = false, onFieldChange, chrome = 'full' }) => {
  const address = event.address || event.locationName || 'Luanda, Angola';
  const [copied, setCopied] = useState(false);
  const [jsFailed, setJsFailed] = useState(false);
  const mapLink = getValidMapUrl(event.mapLink, address);
  const rawKey = `${event?.latitude ?? ''}|${event?.longitude ?? ''}|${event?.address ?? ''}|${event?.locationName ?? ''}`;
  const debouncedKey = useDebounced(rawKey, 600);
  const [dLat, dLng, dAddr, dName] = debouncedKey.split('|');
  const debouncedEvent = {
    latitude: dLat === '' ? null : Number(dLat),
    longitude: dLng === '' ? null : Number(dLng),
    address: dAddr,
    locationName: dName,
  };
  const precise = hasCoords(debouncedEvent);
  const embedSrc = buildEmbedSrc(debouncedEvent);
  const mapTitle = `Mapa: ${dName || dAddr || address}`;

  // Sem nenhum dado de localização e fora de edição: não renderiza nada.
  if (!precise && !embedSrc && !isEditing) return null;

  const handleCopy = () => {
    copyToClipboard(mapLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full flex flex-col items-center ${chrome === 'full' ? 'my-8' : ''}`}>
      <MapFrame>
        {precise && GOOGLE_MAPS_API_KEY && !jsFailed ? (
          <APIProvider
            apiKey={GOOGLE_MAPS_API_KEY}
            onError={() => setJsFailed(true)}
          >
            <JsMap
              key={`${debouncedEvent.latitude},${debouncedEvent.longitude}`}
              lat={debouncedEvent.latitude as number}
              lng={debouncedEvent.longitude as number}
              title={dName || address}
            />
          </APIProvider>
        ) : embedSrc ? (
          <EmbedMap src={embedSrc} title={mapTitle} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 p-6 text-center">
            <MapIcon size={32} />
            <p className="text-sm font-medium">
              Adicione o endereço para ver o mapa aqui.
            </p>
          </div>
        )}
      </MapFrame>

      {isEditing && (
        <div className="w-full max-w-sm text-left mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-500">
              {precise
                ? 'Marcador preciso no mapa ✓'
                : 'Sem marcador preciso — usa o endereço'}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 block">
              Link de Localização (Google Maps)
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address || event.locationName || 'Local')}`,
                  '_blank',
                );
              }}
              className="text-[10px] bg-slate-100 text-blue-600 px-2.5 py-1 rounded-lg shadow-sm hover:bg-white hover:border-slate-300 transition-all flex items-center gap-1 font-sans border border-slate-200"
            >
              <Search size={10} /> Pesquisar no Maps
            </button>
          </div>
          <InlineText
            value={event.mapLink || ''}
            isEditing={isEditing}
            onChange={(val) => onFieldChange?.('mapLink', val)}
            placeholder="https://maps.google.com/..."
            className="text-xs text-blue-500 underline w-full text-center"
          />
        </div>
      )}

      {chrome === 'full' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full sm:w-auto">
            <Button
              onClick={() => window.open(mapLink, '_blank')}
              variant="navy"
              className="shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px]"
            >
              <ExternalLink size={18} /> Abrir no Google Maps
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex items-center justify-center gap-2 bg-white w-full sm:w-auto min-h-[48px] border-slate-200 hover:bg-slate-50"
            >
              {copied ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <Copy size={18} />
              )}
              {copied ? 'Link Copiado!' : 'Copiar Link'}
            </Button>
          </div>

          <h3 className="font-bold text-slate-800 text-xl mt-4 text-center">
            {isEditing ? (
              <InlineText
                value={event.locationName}
                isEditing={isEditing}
                onChange={(val) => onFieldChange?.('locationName', val)}
                placeholder="Nome do Local"
              />
            ) : (
              event.locationName || 'Localização'
            )}
          </h3>

          <div className="text-slate-500 text-sm md:text-base leading-relaxed max-w-md text-center">
            {isEditing ? (
              <InlineText
                type="textarea"
                value={event.address}
                isEditing={isEditing}
                onChange={(val) => onFieldChange?.('address', val)}
                placeholder="Endereço Completo"
              />
            ) : (
              event.address && <p>{event.address}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
