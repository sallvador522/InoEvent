/**
 * Criação de eventos via servidor (POST /api/events) — impõe o limite de
 * criação por plano (§7) no servidor. O cheque client-side continua a existir
 * nos fluxos, mas é contornável; aqui é obrigatório.
 *
 * Uso: tentar primeiro via API; em erro de LIMITE mostrar e PARAR (nunca fazer
 * fallback — seria contornar); em erro de REDE/TIMEOUT, o chamador usa a escrita
 * direta original como fallback (offline/dev). Timeout de 15s: servidor preso
 * nunca trava o botão para sempre.
 */
import { auth } from '../components/FirebaseProvider';
import { getIdToken } from 'firebase/auth';

export interface ApiEventError extends Error {
  code?: string;
  limit?: number;
  current?: number;
  upgradeTo?: string | null;
}

/** Timeout para o servidor responder (fora disso = fallback, nunca preso). */
export const EVENT_API_TIMEOUT_MS = 15000;

export async function createEventViaApi(
  eventId: string,
  payload: Record<string, any>,
  draft = false,
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    const err = new Error('no-auth') as ApiEventError;
    err.code = 'NO_AUTH';
    throw err;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), EVENT_API_TIMEOUT_MS);
  let res: Response;
  try {
    const token = await getIdToken(user);
    res = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: eventId, payload, draft }),
      signal: ctrl.signal,
    });
  } catch (networkErr: any) {
    // Servidor inalcançável OU timeout (AbortError) → chamador decide fallback.
    const err = new Error(networkErr?.name === 'AbortError' ? 'timeout' : 'network') as ApiEventError;
    err.code = networkErr?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK';
    err.cause = networkErr;
    throw err;
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || 'Erro ao criar evento.') as ApiEventError;
    err.code = data.code || 'SERVER';
    err.limit = data.limit;
    err.current = data.current;
    err.upgradeTo = data.upgradeTo ?? null;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  return (data.id as string) || eventId;
}
