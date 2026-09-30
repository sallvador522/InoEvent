/**
 * passImage — normalização da foto do casal para os passes de entrada.
 *
 * Porquê: o <img> dos passes usa `crossOrigin="anonymous"` (exigido pelo
 * export PNG). Qualquer valor inválido (objeto {url}, string vazia, blob
 * revogado, token expirado) ou sem CORS rebenta a foto E o download.
 * Este helper garante sempre uma string carregável; o <img> com onError
 * (ver PassPhoto) trata o resto em runtime.
 */

/** Extrai string de URL de string | {url} | qualquer outra coisa. */
export function resolvePassImage(src: unknown, fallback: string): string {
  if (typeof src === 'string' && src.trim()) return src.trim();
  if (src && typeof src === 'object') {
    const url = (src as { url?: unknown }).url;
    if (typeof url === 'string' && url.trim()) return url.trim();
  }
  return fallback;
}

/**
 * Primeira foto da galeria (string | {url}) — a mesma que as capas do
 * convite usam quando heroImage está vazio (`heroImage || gallery[0]`).
 * Garante: foto do passe === foto do convite em todos os layouts.
 */
export function firstGalleryPhoto(gallery: unknown): string | undefined {
  if (!Array.isArray(gallery) || gallery.length === 0) return undefined;
  const item = gallery[0] as unknown;
  if (typeof item === 'string' && item.trim()) return item.trim();
  if (item && typeof item === 'object') {
    const url = (item as { url?: unknown }).url;
    if (typeof url === 'string' && url.trim()) return url.trim();
  }
  return undefined;
}

/**
 * onError handler partilhado: troca UMA vez para o fallback local.
 * (CORS bloqueado, 404, token expirado e blob revogado disparam onError.)
 */
export function swapToFallback(
  e: React.SyntheticEvent<HTMLImageElement>,
  fallback: string,
): void {
  const el = e.currentTarget;
  if (el.dataset.fbk !== '1') {
    el.dataset.fbk = '1';
    el.src = fallback;
  }
}
