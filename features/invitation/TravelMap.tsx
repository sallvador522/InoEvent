import React, { useEffect, useState } from 'react';
import { Map, Marker, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { MapEmbed } from '../../components/MapEmbed';
import { Map as MapIcon, ExternalLink, Copy, Check, Navigation, Star, MapPin } from 'lucide-react';
import { InlineText } from '../../components/InlineEdit';
import { copyToClipboard } from '../../lib/clipboard';
import { buildDirectionsUrl, buildEmbedSrc, buildMapLink, formatRating, hasCoords, withAngolaBias } from '../../lib/maps';

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

export type TravelTone =
  | 'classic'
  | 'minimal'
  | 'gold'
  | 'luxury'
  | 'garden'
  | 'rustic'
  | 'industrial'
  | 'bridal'
  | 'bridal-minimal'
  | 'tropical'
  | 'baby-boy'
  | 'baby-girl'
  | 'limintso-gold'
  | 'limintso-me';

interface ToneTokens {
  card: string;
  pin: string;
  label: string;
  name: string;
  addr: string;
  badgeRating: string;
  badgePlus: string;
  coords: string;
  link: string;
  btnPrimary: string;
  btnSecondary: string;
}

const toneCard: Record<TravelTone, ToneTokens> = {
  classic: {
    card: 'bg-white border-slate-200 shadow-sm',
    pin: 'text-[#8a6d1c]',
    label: 'text-slate-400',
    name: 'text-slate-900',
    addr: 'text-slate-500',
    badgeRating: 'text-amber-700 bg-amber-50 border-amber-200',
    badgePlus: 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100',
    coords: 'text-slate-400',
    link: 'text-[#1B365D]',
    btnPrimary: '!bg-[#1B365D] !text-white hover:!bg-[#152C4E] !shadow-[#1B365D]/20',
    btnSecondary: '!bg-white !border-slate-200 !text-slate-800 hover:!bg-slate-50',
  },
  minimal: {
    card: 'bg-white border-[#E8E2D5] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)]',
    pin: 'text-[#8A817C]',
    label: 'text-[#C2B280]',
    name: 'text-[#1a1a1a]',
    addr: 'text-[#6B6560]',
    badgeRating: 'text-[#8A817C] bg-[#F9F7F2] border-[#E8E2D5]',
    badgePlus: 'bg-white border-[#E8E2D5] text-[#6B6560] hover:bg-[#F9F7F2] font-mono',
    coords: 'text-[#A8A29E]',
    link: 'text-[#8A817C]',
    btnPrimary: '!bg-[#1a1a1a] !text-white hover:!bg-black !shadow-black/20',
    btnSecondary: '!bg-white !border-[#E8E2D5] !text-[#2C2C2C] hover:!bg-[#F9F7F2]',
  },
  gold: {
    card: 'bg-[#0F1419] border-[#BF9B30]/20 shadow-[0_12px_32px_rgba(0,0,0,0.35)]',
    pin: 'text-[#BF9B30]',
    label: 'text-[#BF9B30]/70',
    name: 'text-white',
    addr: 'text-white/60',
    badgeRating: 'text-amber-300 bg-[#BF9B30]/15 border-[#BF9B30]/30',
    badgePlus: 'bg-white/5 border-[#BF9B30]/20 text-white/70 hover:bg-white/10 font-mono',
    coords: 'text-white/35',
    link: 'text-[#BF9B30]',
    btnPrimary: '!bg-[#BF9B30] !text-[#0F1419] hover:!bg-[#d4ad3a] !shadow-[#BF9B30]/20',
    btnSecondary: '!bg-white/5 !border-[#BF9B30]/20 !text-white hover:!bg-white/10',
  },
  luxury: {
    card: 'bg-[#0F1419] border-[#BF9B30]/20 shadow-[0_12px_32px_rgba(0,0,0,0.35)]',
    pin: 'text-[#BF9B30]',
    label: 'text-[#BF9B30]/70',
    name: 'text-white',
    addr: 'text-white/60',
    badgeRating: 'text-amber-300 bg-[#BF9B30]/15 border-[#BF9B30]/30',
    badgePlus: 'bg-white/5 border-[#BF9B30]/20 text-white/70 hover:bg-white/10 font-mono',
    coords: 'text-white/35',
    link: 'text-[#BF9B30]',
    btnPrimary: '!bg-[#BF9B30] !text-[#0F1419] hover:!bg-[#d4ad3a] !shadow-[#BF9B30]/20',
    btnSecondary: '!bg-white/5 !border-[#BF9B30]/20 !text-white hover:!bg-white/10',
  },
  garden: {
    card: 'bg-[#FFFCF8] border-[#EAE5DF] shadow-sm',
    pin: 'text-[#7A9E7E]',
    label: 'text-[#9AA89E]',
    name: 'text-[#2D3A2E]',
    addr: 'text-[#6B7A6E]',
    badgeRating: 'text-amber-700 bg-amber-50 border-amber-200',
    badgePlus: 'bg-white border-[#EAE5DF] text-[#6B7A6E] hover:bg-[#F5F0E8]',
    coords: 'text-[#9AA89E]',
    link: 'text-[#5A7A5E]',
    btnPrimary: '!bg-[#5D6D55] !text-white hover:!bg-[#4C5A46] !shadow-[#5D6D55]/20',
    btnSecondary: '!bg-white !border-[#EAE5DF] !text-[#5D6D55] hover:!bg-[#F5F0E8]',
  },
  rustic: {
    card: 'bg-[#FFFBF0] border-[#E8DCC8] shadow-sm',
    pin: 'text-[#8D6E63]',
    label: 'text-[#8D6E63]',
    name: 'text-[#4E342E]',
    addr: 'text-[#8D6E63]',
    badgeRating: 'text-[#5D4037] bg-[#FDF5E6] border-[#E8DCC8]',
    badgePlus: 'bg-white border-[#E8DCC8] text-[#5D4037] hover:bg-[#FDF5E6] font-mono',
    coords: 'text-[#A1887F]',
    link: 'text-[#5D4037]',
    btnPrimary: '!bg-[#5D4037] !text-[#FDF5E6] hover:!bg-[#4E342E] !shadow-[#5D4037]/20',
    btnSecondary: '!bg-white !border-[#E8DCC8] !text-[#5D4037] hover:!bg-[#FDF5E6]',
  },
  industrial: {
    card: 'bg-[#1A1A1A] border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.5)]',
    pin: 'text-white',
    label: 'text-white/50',
    name: 'text-white',
    addr: 'text-white/60',
    badgeRating: 'text-white bg-white/10 border-white/20',
    badgePlus: 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 font-mono',
    coords: 'text-white/40',
    link: 'text-white',
    btnPrimary: '!bg-white !text-black hover:!bg-white/90 !shadow-white/20',
    btnSecondary: '!bg-white/5 !border-white/15 !text-white hover:!bg-white/10',
  },
  bridal: {
    card: 'bg-white/70 backdrop-blur-xl border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)]',
    pin: 'text-[#C9A8A8]',
    label: 'text-[#B89A9A]',
    name: 'text-[#3D2E2E]',
    addr: 'text-[#8A7A7A]',
    badgeRating: 'text-[#8A6A6A] bg-[#FFF0F0] border-[#F0D8D8]',
    badgePlus: 'bg-white/80 border-[#F0D8D8] text-[#8A7A7A] hover:bg-white',
    coords: 'text-[#B8A8A8]',
    link: 'text-[#9A7A7A]',
    btnPrimary: '!bg-[#4A3B42] !text-white hover:!bg-[#3D2E30] !shadow-[#4A3B42]/20',
    btnSecondary: '!bg-white/80 !border-white !text-[#4A3B42] hover:!bg-white',
  },
  'bridal-minimal': {
    card: 'bg-white border-slate-200 shadow-sm',
    pin: 'text-[#111111]',
    label: 'text-[#666666]',
    name: 'text-[#111111]',
    addr: 'text-[#666666]',
    badgeRating: 'text-[#111111] bg-slate-50 border-slate-200',
    badgePlus: 'bg-white border-slate-200 text-[#666666] hover:bg-slate-50 font-mono',
    coords: 'text-[#999999]',
    link: 'text-[#111111]',
    btnPrimary: '!bg-[#111111] !text-white hover:!bg-black !shadow-black/20',
    btnSecondary: '!bg-white !border-slate-200 !text-[#111111] hover:!bg-slate-50',
  },
  tropical: {
    card: 'bg-white/70 backdrop-blur-xl border-[#D8E2D9] shadow-sm',
    pin: 'text-[#1A3A2A]',
    label: 'text-[#5A7A5E]',
    name: 'text-[#1A3A2A]',
    addr: 'text-[#4A5A4E]',
    badgeRating: 'text-[#1A3A2A] bg-[#F0F4F1] border-[#D8E2D9]',
    badgePlus: 'bg-white border-[#D8E2D9] text-[#4A5A4E] hover:bg-[#F0F4F1] font-mono',
    coords: 'text-[#8AA090]',
    link: 'text-[#1A3A2A]',
    btnPrimary: '!bg-[#1A3A2A] !text-white hover:!bg-[#142E21] !shadow-[#1A3A2A]/20',
    btnSecondary: '!bg-white !border-[#D8E2D9] !text-[#1A3A2A] hover:!bg-[#F0F4F1]',
  },
  'baby-boy': {
    card: 'bg-white/70 backdrop-blur-xl border-blue-100 shadow-sm',
    pin: 'text-[#1A365D]',
    label: 'text-[#4A6A8A]',
    name: 'text-[#1A365D]',
    addr: 'text-[#4A5568]',
    badgeRating: 'text-[#1A365D] bg-[#F0F8FF] border-blue-100',
    badgePlus: 'bg-white border-blue-100 text-[#4A5568] hover:bg-[#F0F8FF] font-mono',
    coords: 'text-[#8AA0B8]',
    link: 'text-[#1B365D]',
    btnPrimary: '!bg-[#1A365D] !text-white hover:!bg-[#152C4E] !shadow-[#1A365D]/20',
    btnSecondary: '!bg-white !border-blue-100 !text-[#1A365D] hover:!bg-[#F0F8FF]',
  },
  'baby-girl': {
    card: 'bg-white/70 backdrop-blur-xl border-rose-100 shadow-sm',
    pin: 'text-[#BE185D]',
    label: 'text-[#C08A9A]',
    name: 'text-[#5C2D3E]',
    addr: 'text-[#8C7A82]',
    badgeRating: 'text-[#5C2D3E] bg-[#FFF5F5] border-rose-100',
    badgePlus: 'bg-white border-rose-100 text-[#8C7A82] hover:bg-[#FFF5F5] font-mono',
    coords: 'text-[#C8A8B0]',
    link: 'text-[#9A2A4A]',
    btnPrimary: '!bg-[#5C2D3E] !text-white hover:!bg-[#4A2331] !shadow-[#5C2D3E]/20',
    btnSecondary: '!bg-white !border-rose-100 !text-[#5C2D3E] hover:!bg-[#FFF5F5]',
  },
  'limintso-gold': {
    card: 'bg-white border-[#dcb349]/25 shadow-sm',
    pin: 'text-[#b49232]',
    label: 'text-[#b49232]',
    name: 'text-slate-800',
    addr: 'text-slate-500',
    badgeRating: 'text-[#8a6d1c] bg-[#dcb349]/10 border-[#dcb349]/30',
    badgePlus: 'bg-[#FCFAF6] border-[#dcb349]/25 text-slate-600 hover:bg-[#dcb349]/10 font-mono',
    coords: 'text-slate-400',
    link: 'text-[#1B365D]',
    btnPrimary: '!bg-[#dcb349] !text-white hover:!bg-[#b49232] !shadow-[#dcb349]/25',
    btnSecondary: '!bg-white !border-[#dcb349]/30 !text-slate-700 hover:!bg-[#dcb349]/10',
  },
  'limintso-me': {
    card: 'bg-white border-[#E9BE5D]/25 shadow-sm',
    pin: 'text-[#b49232]',
    label: 'text-[#b49232]',
    name: 'text-[#121212]',
    addr: 'text-slate-500',
    badgeRating: 'text-[#8a6d1c] bg-[#E9BE5D]/10 border-[#E9BE5D]/30',
    badgePlus: 'bg-[#FCFAF6] border-[#E9BE5D]/30 text-slate-600 hover:bg-[#E9BE5D]/10 font-mono',
    coords: 'text-slate-400',
    link: 'text-[#121212]',
    btnPrimary: '!bg-[#121212] !text-white !border !border-[#E9BE5D]/40 hover:!bg-black !shadow-black/20',
    btnSecondary: '!bg-white !border-[#E9BE5D]/30 !text-[#121212] hover:!bg-[#E9BE5D]/10',
  },
};

const MapFrame: React.FC<{ children: React.ReactNode; tone?: TravelTone; readOnly?: boolean }> = ({ children, tone = 'classic', readOnly }) => {
  const isDark = tone === 'gold' || tone === 'luxury' || tone === 'industrial';
  const frameBorder =
    tone === 'gold' || tone === 'luxury'
      ? 'border-[#BF9B30]/20 shadow-[0_12px_32px_rgba(0,0,0,0.35)]'
      : tone === 'industrial'
        ? 'border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.5)]'
        : tone === 'garden'
          ? 'border-[#EAE5DF] shadow-sm'
          : tone === 'rustic'
            ? 'border-[#E8DCC8] shadow-sm'
            : tone === 'bridal' || tone === 'tropical' || tone === 'baby-boy' || tone === 'baby-girl'
              ? 'border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
              : tone === 'minimal' || tone === 'bridal-minimal'
                ? 'border-[#E8E2D5] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)]'
                : tone === 'limintso-gold'
                  ? 'border-[#dcb349]/25 shadow-sm'
                  : tone === 'limintso-me'
                    ? 'border-[#E9BE5D]/25 shadow-sm'
                    : 'border-slate-200/60 shadow-lg';
  return (
    <div className={`relative w-full overflow-hidden rounded-[1.5rem] border aspect-[16/10] min-h-[220px] ${frameBorder} ${isDark ? 'dark-map bg-[#1A1F26]' : 'bg-slate-100'}`}>
      {children}
      {readOnly ? <div className="absolute inset-0 z-10" aria-hidden tabIndex={-1} style={{ pointerEvents: 'auto' }} title="Mapa só leitura — use o botão Como chegar" /> : null}
      {readOnly ? (
        <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border shadow-sm ${isDark ? 'bg-black/60 text-white border-white/10' : 'bg-white/90 text-slate-600 border-slate-200'}`}>
            <MapPin size={10} /> Só leitura
          </span>
        </div>
      ) : null}
    </div>
  );
};

const JsMap: React.FC<{ lat: number; lng: number; title: string }> = ({
  lat,
  lng,
  title,
}) => {
  const loaded = useApiIsLoaded();
  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
      {loaded ? (
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
      ) : null}
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
  /** 'full' = mapa + card antigo · 'map-only' = só mapa (legado) · 'guest' = card bonito 100% só-leitura por último */
  chrome?: 'full' | 'map-only' | 'guest';
  tone?: TravelTone;
  /**
   * Lado criador = mapa JS interativo (poucas cargas, dentro da cota grátis).
   * Lado convidado = iframe Embed (grátis, escala sem custo). Default: Embed.
   */
  interactive?: boolean;
}> = ({ event, isEditing = false, onFieldChange, chrome = 'full', tone = 'classic', interactive = false }) => {
  const zone = event.locationName || event.address || 'Local do Evento';
  const biasedZone = withAngolaBias(event.formattedAddress || [event.locationName, event.address].filter(Boolean).join(', ') || zone);
  const [copied, setCopied] = useState<'link' | 'plus' | null>(null);
  // Link canónico: mapsUrl (página do lugar) > mapLink (pino) > busca por zona com bias Angola
  const primaryLink = getValidMapUrl(event.mapsUrl || event.mapLink, biasedZone);
  const hasLatLng = typeof event?.latitude === 'number' && typeof event?.longitude === 'number' && isFinite(event.latitude) && isFinite(event.longitude);
  const directionsUrl = hasLatLng
    ? buildDirectionsUrl(event.latitude, event.longitude)
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(biasedZone)}`;
  const ratingText = formatRating(event.rating, event.userRatingsTotal);
  const mapLink = primaryLink;
  const rawKey = `${event?.latitude ?? ''}|${event?.longitude ?? ''}|${event?.locationName ?? ''}|${event?.address ?? ''}|${event?.formattedAddress ?? ''}`;
  const debouncedKey = useDebounced(rawKey, 600);
  const [dLat, dLng, dName, dAddr, dFormatted] = debouncedKey.split('|');
  const debouncedEvent = {
    latitude: dLat === '' ? null : Number(dLat),
    longitude: dLng === '' ? null : Number(dLng),
    locationName: dName,
    address: dAddr,
    formattedAddress: dFormatted || null,
  };
  const precise = hasCoords(debouncedEvent);
  const embedSrc = buildEmbedSrc(debouncedEvent);
  const mapTitle = `Mapa: ${dName || zone}`;
  const isGuest = chrome === 'guest';
  const t = toneCard[tone] || toneCard.classic;

  // Sem nenhum dado de localização e fora de edição: não renderiza nada (mas guest NUNCA esconde por hiddenSections)
  if (!precise && !embedSrc && !isEditing) return null;

  const handleCopy = (kind: 'link' | 'plus' = 'link') => {
    const text = kind === 'plus' && event.plusCode ? event.plusCode : mapLink;
    copyToClipboard(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  // Guest: sempre embed não-interativo, nunca JsMap
  const showJsMap = !isGuest && interactive && precise;

  return (
    <div className={`w-full flex flex-col items-center ${chrome === 'full' ? 'my-8' : isGuest ? 'gap-0' : ''}`}>
      <MapFrame tone={tone} readOnly={isGuest}>
        {showJsMap ? (
          <JsMap
            key={`${debouncedEvent.latitude},${debouncedEvent.longitude}`}
            lat={debouncedEvent.latitude as number}
            lng={debouncedEvent.longitude as number}
            title={dName || zone}
          />
        ) : embedSrc ? (
          <MapEmbed
            src={embedSrc}
            title={mapTitle}
            skeletonClassName={
              tone === 'rustic' ? 'bg-[#E8DCC8]/70'
              : tone === 'gold' || tone === 'luxury' || tone === 'industrial' ? 'bg-white/5'
              : undefined
            }
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 p-6 text-center">
            <MapIcon size={32} />
            <p className="text-sm font-medium">
              {precise
                ? 'Mapa indisponível — use o botão abaixo para abrir no Google Maps.'
                : 'Adicione a zona para ver o mapa aqui.'}
            </p>
          </div>
        )}
      </MapFrame>

      {isEditing && !isGuest && (
        <div className="w-full max-w-sm text-left mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-xs font-bold text-slate-500">
            {precise
              ? 'Marcador preciso no mapa ✓'
              : 'Sem marcador preciso — fixe o pino no editor de localização'}
          </span>
        </div>
      )}

      {/* GUEST CARD BONITO — adaptativo, 100% só-leitura, elegante com animações fluidas — visível também no preview do editor */}
      {isGuest && (
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className={`w-full max-w-md mt-4 rounded-[1.5rem] border overflow-hidden ${t.card}`}
        >
          {event.placePhotoUrl ? (
            <div className="relative h-36 overflow-hidden">
              <img src={event.placePhotoUrl} alt={zone} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 border border-emerald-200 shadow-sm">
                  <MapPin size={12} className="text-emerald-600" /> Local selecionado ✓ {event.locationSource ? `· ${String(event.locationSource).toUpperCase()}` : ''}
                </p>
              </div>
            </div>
          ) : null}
          <div className="p-5 text-left space-y-2.5">
            {!event.placePhotoUrl ? (
              <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${t.label} flex items-center gap-1.5`}>
                <MapPin size={12} className={t.pin} /> Local do evento {event.locationSource ? `· ${String(event.locationSource).toUpperCase()}` : ''}
              </p>
            ) : null}
            <p className={`flex items-start gap-2 font-bold text-[15px] leading-snug ${t.name}`}>
              {!event.placePhotoUrl ? <MapPin size={16} className={`${t.pin} shrink-0 mt-0.5`} /> : null}
              <span className="min-w-0">{zone}</span>
            </p>
            {event.formattedAddress && event.formattedAddress !== zone ? (
              <p className={`text-xs leading-relaxed ${t.addr} ${!event.placePhotoUrl ? 'ml-6' : ''}`}>{event.formattedAddress}</p>
            ) : null}
            {(ratingText || event.plusCode) && (
              <div className={`flex flex-wrap items-center gap-2 ${!event.placePhotoUrl ? 'ml-6' : ''}`}>
                {ratingText ? (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-1 border ${t.badgeRating}`}>
                    <Star size={12} fill="currentColor" /> {ratingText}
                  </span>
                ) : null}
                {event.plusCode ? (
                  <button
                    type="button"
                    onClick={() => handleCopy('plus')}
                    title="Copiar Plus Code"
                    className={`inline-flex items-center gap-1 text-[11px] font-mono rounded-full px-2.5 py-1 border cursor-pointer transition-colors ${t.badgePlus}`}
                  >
                    {event.plusCode} {copied === 'plus' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  </button>
                ) : null}
              </div>
            )}
            {hasLatLng ? (
              <p className={`text-[11px] font-mono ${t.coords} ${!event.placePhotoUrl ? 'ml-6' : ''}`}>
                {Number(event.latitude).toFixed(5)}, {Number(event.longitude).toFixed(5)}
              </p>
            ) : null}
            {event.mapsUrl && event.mapsUrl !== buildMapLink(event.latitude, event.longitude) ? (
              <a
                href={event.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className={`text-[11px] font-bold underline inline-flex items-center gap-1 ${t.link} ${!event.placePhotoUrl ? 'ml-6' : ''}`}
              >
                Ver página no Google Maps <ExternalLink size={11} />
              </a>
            ) : null}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => window.open(directionsUrl, '_blank')}
                variant={tone === 'gold' || tone === 'luxury' || tone === 'industrial' ? 'primary' : 'navy'}
                className={`w-full min-h-[48px] shadow-lg flex items-center justify-center gap-2 ${t.btnPrimary}`}
              >
                <Navigation size={18} /> Como chegar
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(mapLink, '_blank')}
                  variant="outline"
                  className={`flex-1 min-h-[48px] text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 ${t.btnSecondary}`}
                >
                  <ExternalLink size={16} /> Abrir no Maps
                </Button>
                <Button
                  onClick={() => handleCopy('link')}
                  variant="outline"
                  className={`flex-1 min-h-[48px] text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 ${t.btnSecondary}`}
                >
                  {copied === 'link' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  {copied === 'link' ? 'Copiado!' : 'Copiar link'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {chrome === 'full' && (
        <>
          {/* Card rico legado — mantido para retrocompatibilidade (não usado nos layouts novos) */}
          {(event.formattedAddress || ratingText || event.plusCode || event.placePhotoUrl || hasLatLng) && !isEditing ? (
            <div className="w-full max-w-md mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {event.placePhotoUrl ? (
                <img src={event.placePhotoUrl} alt={zone} className="w-full h-36 object-cover" loading="lazy" />
              ) : null}
              <div className="p-4 text-left">
                <p className="flex items-start gap-2 font-bold text-slate-900 text-[15px] leading-snug">
                  <MapPin size={16} className="text-[#8a6d1c] shrink-0 mt-0.5" />
                  <span className="min-w-0">{zone}</span>
                </p>
                {event.formattedAddress && event.formattedAddress !== zone ? (
                  <p className="text-xs text-slate-500 mt-1 ml-6 leading-relaxed">{event.formattedAddress}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 mt-2 ml-6">
                  {ratingText ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                      <Star size={12} fill="currentColor" /> {ratingText}
                    </span>
                  ) : null}
                  {event.plusCode ? (
                    <button
                      type="button"
                      onClick={() => handleCopy('plus')}
                      title="Copiar Plus Code"
                      className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      {event.plusCode} {copied === 'plus' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    </button>
                  ) : null}
                </div>
                {hasLatLng ? (
                  <p className="text-[11px] text-slate-400 mt-2 ml-6 font-mono">
                    {Number(event.latitude).toFixed(5)}, {Number(event.longitude).toFixed(5)}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full sm:w-auto">
            <Button
              onClick={() => window.open(mapLink, '_blank')}
              variant="navy"
              className="shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px]"
            >
              <ExternalLink size={18} /> Abrir no Google Maps
            </Button>
            {hasLatLng ? (
              <Button
                onClick={() => window.open(directionsUrl, '_blank')}
                variant="outline"
                className="flex items-center justify-center gap-2 bg-white w-full sm:w-auto min-h-[48px] border-slate-200 hover:bg-slate-50"
              >
                <Navigation size={18} /> Como chegar
              </Button>
            ) : null}
            <Button
              onClick={() => handleCopy('link')}
              variant="outline"
              className="flex items-center justify-center gap-2 bg-white w-full sm:w-auto min-h-[48px] border-slate-200 hover:bg-slate-50"
            >
              {copied === 'link' ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <Copy size={18} />
              )}
              {copied === 'link' ? 'Link Copiado!' : 'Copiar Link'}
            </Button>
          </div>

          <h3 className="font-bold text-slate-800 text-xl mt-4 text-center">
            {isEditing ? (
              <InlineText
                value={event.locationName}
                isEditing={isEditing}
                onChange={(val) => onFieldChange?.('locationName', val)}
                placeholder="Zona do evento (ex: Talatona, Luanda)"
              />
            ) : (
              event.locationName || 'Localização'
            )}
          </h3>

          {event.address ? (
            <div className="text-slate-500 text-sm md:text-base leading-relaxed max-w-md text-center">
              <p>{event.address}</p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
