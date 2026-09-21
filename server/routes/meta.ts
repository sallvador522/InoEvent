/**
 * Meta CAPI Relay — POST /api/meta/events
 *
 * O browser (com consentimento) envia a conversão com o mesmo `event_id`
 * do Pixel para deduplicação automática na Meta. Este endpoint:
 *  1. valida allowlist + tamanhos (anti-abuso, endpoint público p/ convidados),
 *  2. enriquece user_data (hash SHA256, IP, UA, fbp/fbc),
 *  3. reencaminha para a Conversions API sem nunca partir a UX.
 */
import { Router } from 'express';
import { apiRateLimiter } from '../middleware/index.js';
import { logger } from '../../lib/logger.js';
import {
  hashEmail,
  hashPhone,
  isCapiConfigured,
  parseCookies,
  sendCapiEvent,
} from '../lib/meta-capi.js';

const router = Router();

// Conversões elegíveis para envio server-side (PageView/ViewContent ficam browser-only)
const ALLOWED_EVENTS = new Set(['Lead', 'CompleteRegistration', 'InitiateCheckout']);

function isValidEventId(v: unknown): v is string {
  return typeof v === 'string' && v.length >= 8 && v.length <= 128;
}

router.post('/api/meta/events', apiRateLimiter, async (req, res) => {
  const { event_name, event_id, event_source_url, user_data, custom_data } = (req.body || {}) as {
    event_name?: unknown;
    event_id?: unknown;
    event_source_url?: unknown;
    user_data?: { email?: unknown; phone?: unknown };
    custom_data?: Record<string, any>;
  };

  if (typeof event_name !== 'string' || !ALLOWED_EVENTS.has(event_name)) {
    return res.status(400).json({ error: 'event_name não suportado.' });
  }
  if (!isValidEventId(event_id)) {
    return res.status(400).json({ error: 'event_id inválido.' });
  }
  if (event_source_url !== undefined && typeof event_source_url !== 'string') {
    return res.status(400).json({ error: 'event_source_url inválido.' });
  }

  if (!isCapiConfigured()) {
    logger.warn('[MetaCAPI] Relay chamado sem META_CAPI_ACCESS_TOKEN configurado', {
      category: 'SYSTEM',
    });
    return res.json({ ok: true, sent: false, reason: 'not_configured' });
  }

  try {
    const cookies = parseCookies(req.headers.cookie);
    const result = await sendCapiEvent({
      event_name,
      event_id,
      event_source_url:
        typeof event_source_url === 'string' && event_source_url.startsWith('http')
          ? event_source_url.slice(0, 500)
          : undefined,
      user_data: {
        ...(hashEmail(user_data?.email) ? { em: hashEmail(user_data?.email) as string } : {}),
        ...(hashPhone(user_data?.phone) ? { ph: hashPhone(user_data?.phone) as string } : {}),
        ...(cookies._fbp ? { fbp: cookies._fbp } : {}),
        ...(cookies._fbc ? { fbc: cookies._fbc } : {}),
        ...(req.ip ? { client_ip_address: req.ip } : {}),
        ...(req.get('user-agent') ? { client_user_agent: req.get('user-agent') as string } : {}),
      },
      custom_data,
    });
    return res.json({ ok: true, sent: result.sent, ...(result.reason ? { reason: result.reason } : {}) });
  } catch (err: any) {
    logger.error('[MetaCAPI] Exceção no relay', {
      category: 'SYSTEM',
      data: err?.message || String(err),
    });
    return res.json({ ok: true, sent: false, reason: 'relay_error' });
  }
});

export default router;
