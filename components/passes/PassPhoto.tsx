import React from 'react';
import { resolvePassImage, swapToFallback } from '../../lib/passImage';

interface PassPhotoProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** heroImage bruto do evento (string | {url} | indefinido). */
  src?: unknown;
  /** Caminho local same-origin (ex: /chany-pedro-preview.webp). */
  fallback: string;
}

/**
 * Foto do casal à prova de falha para os passes.
 * - Normaliza o src (objeto {url} → string, vazio → fallback);
 * - crossOrigin exigido pelo export PNG;
 * - onError troca UMA vez para o fallback (CORS, 404, token expirado, blob).
 */
export const PassPhoto: React.FC<PassPhotoProps> = ({
  src,
  fallback,
  alt = 'Casal',
  ...rest
}) => (
  <img
    {...rest}
    alt={alt}
    src={resolvePassImage(src, fallback)}
    crossOrigin="anonymous"
    data-fbk="0"
    onError={(e) => swapToFallback(e, fallback)}
  />
);
