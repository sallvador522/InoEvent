/**
 * Promo self-serve — chamada partilhada pelo modal (UserDashboard) e pelo
 * banner (Dashboard). O servidor decide tudo (elegibilidade 1/conta,
 * kill-switch); aqui só transportamos o token e traduzimos o resultado.
 */
export type ClaimResult = {
  ok: boolean;
  code?: string;
  message?: string;
};

/** Códigos que pedem o caminho manual (WhatsApp) em vez de erro duro. */
export const CLAIM_FALLBACK_CODES = new Set([
  'SELF_SERVE_DISABLED',
  'ANONYMOUS_NOT_ALLOWED',
  'PROMO_ALREADY_USED',
  'PROMO_NOT_ELIGIBLE',
  'PROMO_NOT_NEEDED',
  'EVENT_ALREADY_PAID',
]);

export async function claimFirstEventFree(eventId: string, token?: string): Promise<ClaimResult> {
  try {
    const res = await fetch('/api/promo/claim-first-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ eventId }),
    });
    const data = await res.json().catch(() => ({} as any));
    if (res.ok) return { ok: true };
    return { ok: false, code: (data as any)?.code, message: (data as any)?.error || 'Não foi possível ativar.' };
  } catch {
    return { ok: false, message: 'Sem ligação. Tente de novo.' };
  }
}
