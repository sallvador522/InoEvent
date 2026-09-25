import { useRef } from 'react';

/**
 * Cooldown anti-duplo-clique para ações SÍNCRONAS locais (adicionar item a
 * lista, etc.) — onde não há loading assíncrono para travar o botão.
 * Devolve `allow()`: true na primeira chamada, false nas repetidas dentro
 * da janela (omissão: 600ms). Não substitui `disabled` em ações assíncronas.
 */
export function useCooldown(ms = 600): () => boolean {
  const last = useRef(0);
  return () => {
    const now = Date.now();
    if (now - last.current < ms) return false;
    last.current = now;
    return true;
  };
}
