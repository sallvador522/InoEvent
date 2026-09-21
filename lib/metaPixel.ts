/**
 * Meta Pixel (Facebook) — helper central com gate de consentimento.
 *
 * - O stub `fbq` é carregado em `index.html` (só define a queue, sem init/track).
 * - `initPixel()` só corre após `ino_consent === 'accepted'`.
 * - Todos os `track*` são no-op sem consentimento ou sem `window.fbq`.
 */

export const META_PIXEL_ID =
  (import.meta as any)?.env?.VITE_META_PIXEL_ID || '2309059223221498';

const META_TEST_CODE: string | undefined =
  (import.meta as any)?.env?.VITE_META_PIXEL_TEST_CODE || undefined;

export const CONSENT_KEY = 'ino_consent';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export function hasPixelConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

export function setPixelConsent(value: 'accepted' | 'declined'): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage indisponível — mantém comportamento no-op */
  }
}

let initialized = false;

export function initPixel(): void {
  if (initialized) return;
  if (!hasPixelConsent()) return;
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  try {
    const initArgs: any[] = ['init', META_PIXEL_ID];
    // Test Event Code só em dev — nunca quebrar prod se ausente
    if (META_TEST_CODE && !(import.meta as any)?.env?.PROD) {
      (window.fbq as any)('set', 'testEventCode', META_TEST_CODE);
    }
    (window.fbq as any)(...initArgs);
    initialized = true;
  } catch (err) {
    console.warn('[MetaPixel] init falhou:', err);
  }
}

export function isPixelReady(): boolean {
  return initialized && typeof window !== 'undefined' && typeof window.fbq === 'function';
}

export interface CapiPayload {
  /** Dados brutos (email/telefone em claro) — o hash SHA256 é feito no servidor. */
  user_data?: { email?: string; phone?: string };
  custom_data?: Record<string, any>;
  event_source_url?: string;
}

/** Gera o event_id partilhado browser ↔ CAPI para deduplicação na Meta. */
export function newEventId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as any).randomUUID();
    }
  } catch {
    /* fallback abaixo */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Reencaminha a conversão para a Conversions API via relay same-origin.
 * Fire-and-forget: nunca rejeita, nunca bloqueia a UX.
 */
export async function relayCapiEvent(
  event_name: string,
  event_id: string,
  capi?: CapiPayload,
): Promise<void> {
  if (!event_id || !hasPixelConsent()) return;
  try {
    await fetch('/api/meta/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name,
        event_id,
        event_source_url:
          capi?.event_source_url ||
          (typeof window !== 'undefined' ? window.location.href : undefined),
        ...(capi?.user_data ? { user_data: capi.user_data } : {}),
        ...(capi?.custom_data ? { custom_data: capi.custom_data } : {}),
      }),
    });
  } catch {
    /* relay indisponível — o evento browser já foi enviado */
  }
}

/**
 * Disparo genérico com guardas — nunca rebenta a app se o Pixel estiver bloqueado.
 * Gera sempre um event_id (deduplicação) e devolve-o; se `capi` for passado,
 * envia também server-side com o MESMO event_id.
 */
export function trackPixelEvent(
  name: string,
  params?: Record<string, any>,
  capi?: CapiPayload,
): string | null {
  if (!hasPixelConsent()) return null;
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return null;
  // Garante init tardio (ex: user aceitou noutra aba/sessão)
  if (!initialized) initPixel();
  if (!initialized) return null;
  const eventId = newEventId();
  try {
    if (params) {
      (window.fbq as any)('track', name, params, { eventID: eventId });
    } else {
      (window.fbq as any)('track', name, undefined, { eventID: eventId });
    }
  } catch (err) {
    console.warn(`[MetaPixel] track ${name} falhou:`, err);
    return null;
  }
  if (capi) {
    void relayCapiEvent(name, eventId, capi);
  }
  return eventId;
}

export function trackPixelPageView(path?: string): void {
  // `path` não é parâmetro oficial do PageView — segue como contexto em CustomData
  // apenas quando útil para debug; o PageView base vai sem params.
  if (path) {
    trackPixelEvent('PageView');
  } else {
    trackPixelEvent('PageView');
  }
}

export function trackPixelViewContent(eventId: string, extra?: Record<string, any>): string | null {
  return trackPixelEvent('ViewContent', {
    content_ids: [eventId],
    content_type: 'event',
    ...extra,
  });
}

export function trackPixelLead(extra?: Record<string, any>, capi?: CapiPayload): string | null {
  return trackPixelEvent('Lead', extra, capi);
}

export function trackPixelCompleteRegistration(extra?: Record<string, any>, capi?: CapiPayload): string | null {
  return trackPixelEvent('CompleteRegistration', extra, capi);
}

export function trackPixelInitiateCheckout(extra?: Record<string, any>, capi?: CapiPayload): string | null {
  return trackPixelEvent('InitiateCheckout', {
    currency: 'AOA',
    ...extra,
  }, capi);
}
