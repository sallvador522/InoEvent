/**
 * Subscriptions — Business B2B (§16)
 *
 * GET  /api/subscriptions/me            — minha subscrição activa
 * POST /api/subscriptions               — cria subscrição Business (SÓ admin;
 *                                         self-service pagaria sem pagar: antes
 *                                         qualquer logado oferecia Business a si
 *                                         mesmo sem pedido nem pagamento)
 * POST /api/subscriptions/:id/cancel    — cancela (dono ou admin)
 */
import { Router } from 'express';
import { apiRateLimiter } from '../middleware/index.js';
import { createSubscription, getActiveSubscription, cancelSubscription, renewSubscription } from '../lib/billing.js';
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
  // Criação SÓ pelo admin (após pagamento confirmado fora da API).
  // Self-service aqui equivalia a Business grátis sem pedido.
  if (auth.email !== 'antoniosalvador522@gmail.com') {
    return res.status(403).json({ error: 'Subscrições Business são ativadas pela equipa após pagamento. Fale connosco no WhatsApp.' });
  }
  const { userId } = req.body as any;
  const targetUid = userId || auth.uid;
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
    // Só dono ou admin: antes qualquer logado cancelava a sub de terceiros por ID.
    const { getDb } = await import('../lib/firebase-admin.js');
    const snap = await getDb().collection('subscriptions').doc(req.params.id as string).get();
    if (!snap.exists) return res.status(404).json({ error: 'Subscrição não encontrada' });
    const owner = (snap.data() as any)?.userId;
    const isAdmin = auth.email === 'antoniosalvador522@gmail.com';
    if (owner !== auth.uid && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await cancelSubscription(req.params.id as string);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: 'Erro' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/subscriptions/:id/renew — renova +30d e reativa (admin, ciclo manual)
// ---------------------------------------------------------------------------
router.post('/api/subscriptions/:id/renew', apiRateLimiter, async (req, res) => {
  const auth = await getAuthUser(req);
  if (!auth || auth.email !== 'antoniosalvador522@gmail.com') {
    return res.status(403).json({ error: 'Apenas admin' });
  }
  try {
    const sub = await renewSubscription(req.params.id as string);
    if (!sub) return res.status(404).json({ error: 'Subscrição não encontrada' });
    return res.json({ subscription: sub });
  } catch (e: any) {
    logger.error('Erro renovar subscription', { category: 'SYSTEM', data: e?.message || e });
    return res.status(500).json({ error: 'Erro' });
  }
});

export default router;
