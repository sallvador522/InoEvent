import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Skeleton } from './ui/Skeleton';

/**
 * Iframe do Google Maps SEM chave (`output=embed`).
 * Funciona só com a Maps Embed API — sem JavaScript API, sem faturação
 * por carga, sem configuração no Console além de ativar a Embed API.
 * O skeleton tem timeout: nunca fica cinzento para sempre. Se o iframe
 * não carregar (bloqueio/CSP/offline/query sem resultado), mostra
 * fallback honesto em vez de retângulo vazio.
 */
export const MapEmbed: React.FC<{ src: string; title: string; skeletonClassName?: string }> = ({
  src,
  title,
  skeletonClassName,
}) => {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const loadedRef = useRef(false);
  useEffect(() => {
    loadedRef.current = false;
    setLoading(true);
    setFailed(false);
    const t = setTimeout(() => {
      if (!loadedRef.current) {
        setLoading(false);
        setFailed(true);
      }
    }, 10000);
    return () => clearTimeout(t);
  }, [src]);
  return (
    <>
      {loading && !failed && (skeletonClassName ? (
        <div className={`absolute inset-0 rounded-none animate-pulse ${skeletonClassName}`} aria-hidden="true" />
      ) : (
        <Skeleton className="absolute inset-0 rounded-none" />
      ))}
      {!failed && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          allowFullScreen
          onLoad={() => { loadedRef.current = true; setLoading(false); setFailed(false); }}
          className="absolute inset-0 h-full w-full border-0"
        />
      )}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center" role="status">
          <MapPin size={28} className="text-slate-400" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-600">Mapa indisponível aqui</p>
          <p className="text-xs text-slate-500">Use o botão Como chegar abaixo para abrir no Google Maps.</p>
        </div>
      )}
    </>
  );
};
