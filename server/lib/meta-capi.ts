/**
 * Meta Conversions API (CAPI) — envio server-side de conversões.
 *
 * Usado em par com o Pixel browser (`lib/metaPixel.ts`) via `event_id`
 * partilhado para deduplicação automática na Meta.
 *
 * Env (server-only, NUNCA prefixar com VITE_):
 *   META_CAPI_ACCESS_TOKEN — token da Conversions API (Events Manager > Settings)
 *   META_PIXEL_ID          — default 2309059223221498
 *   META_CAPI_TEST_CODE    — código de Test Events (só dev)
 *   META_CAPI_ENABLED      — 'false' desliga o envio (default ligado se houver token)
 */
import crypto from 'node:crypto';
import { logger } from '../../lib/logger.js';

const PIXEL_ID =
  process.env.META_PIXEL_ID || process.env.VITE_META_PIXEL_ID || '2309059223221498';
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || '';
const TEST_CODE = process.env.META_CAPI_TEST_CODE || '';
const GRAPH_VERSION = 'v21.0';
const TIMEOUT_MS = 6000;

export interface CapiUserData {
  em?: string; // email já com hash SHA256 (hex)
  ph?: string; // telefone já com hash SHA256 (hex)
  fbp?: string;
  fbc?: string;
  client_ip_address?: string;
  client_user_agent?: string;
}

export interface CapiEventInput {
  event_name: string;
  event_id: string;
  event_time?: number; // epoch segundos — default agora
  event_source_url?: string;
  action_source?: string; // default 'website'
  user_data?: CapiUserData;
  custom_data?: Record<string, any>;
}

export function isCapiConfigured(): boolean {
  if (process.env.META_CAPI_ENABLED === 'false') return false;
  return ACCESS_TOKEN.length > 0;
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

/** Normaliza + hash de email segundo spec da Meta (lowercase, trim). */
export function hashEmail(email: unknown): string | undefined {
  if (typeof email !== 'string') return undefined;
  const norm = email.trim().toLowerCase();
  if (!norm || norm.length > 254 || !norm.includes('@')) return undefined;
  return sha256Hex(norm);
}

/** Normaliza + hash de telefone (só dígitos, com indicativo). */
export function hashPhone(phone: unknown): string | undefined {
  if (typeof phone !== 'string') return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return undefined;
  return sha256Hex(digits);
}

/** Parse minimalista do header Cookie (sem dependências). */
export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key && val && (key === '_fbp' || key === '_fbc')) {
      out[key] = decodeURIComponent(val);
    }
  }
  return out;
}

function sanitizeCustomData(data: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    } else if (Array.isArray(v) && v.every((i) => typeof i === 'string')) {
      out[k] = v.slice(0, 20);
    }
  }
  // Guarda anti-abuso: payload pequeno
  if (JSON.stringify(out).length > 4000) return undefined;
  return out;
}

/**
 * Envia um evento à Conversions API. Nunca lança — devolve `{ sent }`
 * e regista falhas no logger para não partir fluxos de UX (RSVP, checkout).
 */
export async function sendCapiEvent(
  input: CapiEventInput,
): Promise<{ sent: boolean; reason?: string }> {
  if (!isCapiConfigured()) {
    return { sent: false, reason: 'not_configured' };
  }
  const event_time =
    typeof input.event_time === 'number' && input.event_time > 0
      ? Math.floor(input.event_time)
      : Math.floor(Date.now() / 1000);

  const body: Record<string, any> = {
    data: [
      {
        event_name: input.event_name,
        event_time,
        event_id: input.event_id,
        action_source: input.action_source || 'website',
        ...(input.event_source_url ? { event_source_url: input.event_source_url } : {}),
        ...(input.user_data ? { user_data: input.user_data } : {}),
        ...(() => {
          const cd = sanitizeCustomData(input.custom_data);
          return cd ? { custom_data: cd } : {};
        })(),
      },
    ],
  };
  if (TEST_CODE) {
    body.test_event_code = TEST_CODE;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (data as any)?.error) {
      logger.warn('[MetaCAPI] Evento rejeitado pela Meta', {
        category: 'SYSTEM',
        data: { event_name: input.event_name, status: res.status, error: (data as any)?.error || data },
      });
      return { sent: false, reason: 'meta_rejected' };
    }
    return { sent: true };
  } catch (err: any) {
    logger.warn('[MetaCAPI] Falha de rede/timeout', {
      category: 'SYSTEM',
      data: { event_name: input.event_name, message: err?.message || String(err) },
    });
    return { sent: false, reason: 'network_error' };
  } finally {
    clearTimeout(timer);
  }
}
