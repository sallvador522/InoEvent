/**
 * Subscriptions — Business B2B (§16)
 * 
 * GET  /api/subscriptions/me            — minha subscrição activa
 * POST /api/subscriptions               — cria subscrição Business (admin ou self)
 * POST /api/subscriptions/:id/cancel    — cancela
 */
import { Router } from 'express';
import { apiRateLimiter } from '../middleware/index.js';
import { createSubscription, getActiveSubscription, cancelSubscription } from '../lib/billing.js';
import { admin } from '../lib/firebase-admin.js';
import { logger } from '../../lib/logger.js';

const router = Router();

async function getAuthUser(req: any) {
  const hdr = req.headers.authorization as string | undefined;
  if (!hdr || !hdr.startsWith('Bearer ')) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(hdr.slice(7));
    return { uid: decoded.uid, email: decoded.email };
  } catch { return null; }
}

router.get('/api/subscriptions/me', apiRateLimiter, async (req, res) => {
  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Auth required' });
  const sub = await getActiveSubscription(auth.uid);
  return res.json({ subscription: sub, hasActiveBusiness: !!sub });
});

router.post('/api/subscriptions', apiRateLimiter, async (req, res) => {
  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Auth required' });
  const { userId } = req.body as any;
  const targetUid = userId || auth.uid;
  // só admin pode criar para outro uid
  if (targetUid !== auth.uid && auth.email !== 'antoniosalvador522@gmail.com') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const sub = await createSubscription(targetUid, 'business');
    return res.status(201).json({ subscription: sub });
  } catch (e: any) {
    logger.error('Erro criar subscription', { category: 'SYSTEM', data: e?.message || e });
    return res.status(500).json({ error: 'Erro' });
  }
});

router.post('/api/subscriptions/:id/cancel', apiRateLimiter, async (req, res) => {
  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Auth required' });
  try {
    await cancelSubscription(req.params.id as string);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: 'Erro' });
  }
});

export default router;
