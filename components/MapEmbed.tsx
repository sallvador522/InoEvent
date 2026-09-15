import React, { useEffect, useState } from 'react';
import { Skeleton } from './ui/Skeleton';

/**
 * Iframe do Google Maps SEM chave (`output=embed`).
 * Funciona só com a Maps Embed API — sem JavaScript API, sem faturação
 * por carga, sem configuração no Console além de ativar a Embed API.
 * O skeleton tem timeout: nunca fica cinzento para sempre.
 */
export const MapEmbed: React.FC<{ src: string; title: string }> = ({
  src,
  title,
}) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(t);
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
