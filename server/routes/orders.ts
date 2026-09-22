/**
 * Orders & Billing Routes (§12, §13, §14)
 * 
 * POST   /api/orders                 — cria pedido (pending)
 * GET    /api/orders/:id             — obtém pedido
 * GET    /api/events/:id/order       — pedido do evento
 * POST   /api/orders/:id/confirm     — admin confirma pagamento (whatsapp_manual)
 * POST   /api/orders/:id/fail        — marca como failed
 * POST   /api/webhooks/payment       — webhook genérico (fonte da verdade futura)
 * POST   /api/events/:id/upgrade     — upgrade essencial→premium→vip
 * POST   /api/events/:id/renew       — renovação após expiração (§9)
 */
import { Router } from 'express';
import { getDb } from '../lib/firebase-admin.js';
import { apiRateLimiter } from '../middleware/index.js';
import { createOrder, getOrder, getOrderByEvent, confirmPayment, failPayment, backfillAccountStamps } from '../lib/billing.js';
import { getPlanConfig, normalizePlanId, calculateOrderTotal, calculateExpiresAt, PLANS } from '../../config/plans.js';
import { canUpgrade, canDowngrade, isEventExpired } from '../lib/entitlements.js';
import { logger } from '../../lib/logger.js';
import { admin } from '../lib/firebase-admin.js';

const router = Router();

// ---------------------------------------------------------------------------
// Helper — verifica Firebase ID token quando disponível
// ---------------------------------------------------------------------------
async function getAuthUser(req: any): Promise<{ uid: string; email?: string } | null> {
  const hdr = req.headers.authorization as string | undefined;
  if (!hdr || !hdr.startsWith('Bearer ')) return null;
  const token = hdr.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST /api/orders — cria pedido
// ---------------------------------------------------------------------------
router.post('/api/orders', apiRateLimiter, async (req, res) => {
  const { userId, eventId, plan, addons, organizationId } = req.body as any;
  const authUser = await getAuthUser(req);
  // se autenticado, força userId = auth uid
  const effectiveUserId = authUser?.uid || userId;
  if (!effectiveUserId || !eventId || !plan) {
    return res.status(400).json({ error: 'userId, eventId e plan são obrigatórios' });
  }
  const planId = normalizePlanId(plan);
  if (!PLANS[planId as any]) return res.status(400).json({ error: 'Plano inválido' });

  try {
    // verifica evento existe e pertence ao user (se autenticado)
    const db = getDb();
    const evSnap = await db.collection('events').doc(eventId).get();
    if (!evSnap.exists) return res.status(404).json({ error: 'Evento não encontrado' });
    const ev = evSnap.data() as any;
    if (authUser && ev.ownerId !== authUser.uid) {
      // admin pode criar para outros; verifica se é admin via token email
      const isAdmin = authUser.email === 'antoniosalvador522@gmail.com';
      if (!isAdmin) return res.status(403).json({ error: 'Sem permissão para este evento' });
    }

    // evita duplicar pedido pending para mesmo evento/plano
    const existing = await getOrderByEvent(eventId);
    if (existing && existing.billingStatus === 'pending' && existing.plan === planId) {
      return res.json({ order: existing, reused: true });
    }

    const order = await createOrder({
      userId: effectiveUserId,
      eventId,
      plan: planId as any,
      addons: addons || {},
      organizationId: organizationId || null,
    });
    return res.status(201).json({ order });
  } catch (err: any) {
    logger.error('Erro ao criar order', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/orders/:id
// ---------------------------------------------------------------------------
router.get('/api/orders/:id', apiRateLimiter, async (req, res) => {
  const id = req.params.id as string;
  const order = await getOrder(id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  return res.json({ order });
});

// ---------------------------------------------------------------------------
// GET /api/events/:id/order
// ---------------------------------------------------------------------------
router.get('/api/events/:id/order', apiRateLimiter, async (req, res) => {
  const eventId = req.params.id as string;
  const order = await getOrderByEvent(eventId);
  if (!order) return res.status(404).json({ error: 'Nenhum pedido para este evento' });
  return res.json({ order });
});

// ---------------------------------------------------------------------------
// POST /api/orders/:id/confirm — confirma pagamento (admin)
// ---------------------------------------------------------------------------
router.post('/api/orders/:id/confirm', apiRateLimiter, async (req, res) => {
  const id = req.params.id as string;
  const { providerTransactionId } = req.body as any;
  const authUser = await getAuthUser(req);
  // exige admin se autenticado; se não houver auth (dev), permite mas loga
  if (authUser && authUser.email !== 'antoniosalvador522@gmail.com') {
    return res.status(403).json({ error: 'Apenas admin pode confirmar pagamentos' });
  }
  try {
    const order = await confirmPayment(id, providerTransactionId);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    return res.json({ order, message: 'Pagamento confirmado, evento activado' });
  } catch (err: any) {
    logger.error('Erro ao confirmar pagamento', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao confirmar' });
  }
});

router.post('/api/orders/:id/fail', apiRateLimiter, async (req, res) => {
  const id = req.params.id as string;
  const { reason } = req.body as any;
  try {
    await failPayment(id, reason);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/backfill-accounts — carimba eventos de contas pagas (retroativos)
// Body opcional: { userId } para um utilizador; sem body = todas as contas pagas.
// Admin estrito: exige Bearer de admin (sem modo dev permissivo — escrita em massa).
// ---------------------------------------------------------------------------
router.post('/api/admin/backfill-accounts', apiRateLimiter, async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser || authUser.email !== 'antoniosalvador522@gmail.com') {
    return res.status(403).json({ error: 'Apenas admin' });
  }
  try {
    const { userId } = (req.body || {}) as any;
    if (userId && typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId inválido' });
    }
    const result = await backfillAccountStamps(userId);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    logger.error('Backfill contas erro', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro no backfill' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/webhooks/payment — webhook genérico (fonte da verdade §12)
// ---------------------------------------------------------------------------
router.post('/api/webhooks/payment', async (req, res) => {
  const { orderId, status, providerTransactionId, provider } = req.body as any;
  if (!orderId || !status) return res.status(400).json({ error: 'orderId e status obrigatórios' });
  try {
    if (status === 'paid' || status === 'success') {
      const order = await confirmPayment(orderId, providerTransactionId);
      return res.json({ success: true, order });
    }
    if (status === 'failed') {
      await failPayment(orderId, `webhook ${provider}`);
      return res.json({ success: true });
    }
    return res.status(400).json({ error: 'status inválido' });
  } catch (err: any) {
    logger.error('Webhook erro', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Webhook error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/events/:id/upgrade — §10
// ---------------------------------------------------------------------------
router.post('/api/events/:id/upgrade', apiRateLimiter, async (req, res) => {
  const eventId = req.params.id as string;
  const { toPlan, addons } = req.body as any;
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Autenticação obrigatória' });

  const toPlanId = normalizePlanId(toPlan);
  if (!PLANS[toPlanId as any]) return res.status(400).json({ error: 'Plano destino inválido' });

  try {
    const db = getDb();
    const evSnap = await db.collection('events').doc(eventId).get();
    if (!evSnap.exists) return res.status(404).json({ error: 'Evento não encontrado' });
    const ev = evSnap.data() as any;
    if (ev.ownerId !== authUser.uid && authUser.email !== 'antoniosalvador522@gmail.com') {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    const fromPlan = normalizePlanId(ev.plan || ev.planId || 'essential');
    if (!canUpgrade(fromPlan, toPlanId)) {
      return res.status(400).json({ error: `Upgrade de ${fromPlan} para ${toPlanId} não permitido` });
    }

    // Cria order de upgrade pendente
    const order = await createOrder({
      userId: ev.ownerId,
      eventId,
      plan: toPlanId as any,
      addons: addons || ev.addons || {},
    });

    // Para preservar dados: não duplica evento (§10). Apenas retorna order para pagamento.
    return res.status(201).json({
      order,
      message: `Upgrade de ${fromPlan} → ${toPlanId} criado. Confirme pagamento para activar.`,
      priceDifference: getPlanConfig(toPlanId).price - getPlanConfig(fromPlan).price,
      preservesData: true,
    });
  } catch (err: any) {
    logger.error('Erro upgrade', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao criar upgrade' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/events/:id/renew — §9 renovação após expiração
// ---------------------------------------------------------------------------
router.post('/api/events/:id/renew', apiRateLimiter, async (req, res) => {
  const eventId = req.params.id as string;
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Autenticação obrigatória' });

  try {
    const db = getDb();
    const evSnap = await db.collection('events').doc(eventId).get();
    if (!evSnap.exists) return res.status(404).json({ error: 'Evento não encontrado' });
    const ev = evSnap.data() as any;
    if (ev.ownerId !== authUser.uid) return res.status(403).json({ error: 'Sem permissão' });

    const plan = normalizePlanId(ev.plan || ev.planId || 'essential');
    // só permite renovar se expirado
    const expired = isEventExpired(ev);
    if (!expired) return res.status(400).json({ error: 'Evento ainda activo, não precisa renovar' });

    const order = await createOrder({
      userId: ev.ownerId,
      eventId,
      plan: plan as any,
      addons: ev.addons || {},
    });
    return res.status(201).json({ order, message: 'Pedido de renovação criado' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao renovar' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/events/:id/entitlements — helper para frontend §5
// ---------------------------------------------------------------------------
router.get('/api/events/:id/entitlements', apiRateLimiter, async (req, res) => {
  const eventId = req.params.id as string;
  try {
    const db = getDb();
    const evSnap = await db.collection('events').doc(eventId).get();
    if (!evSnap.exists) return res.status(404).json({ error: 'Evento não encontrado' });
    const ev = evSnap.data() as any;
    const plan = normalizePlanId(ev.plan || ev.planId || 'essential');
    const config = getPlanConfig(plan);
    const guestsSnap = await db.collection('events').doc(eventId).collection('guests').get().catch(() => ({ size: 0 } as any));
    const guestCount = guestsSnap.size || 0;
    return res.json({
      plan,
      planName: config.name,
      price: config.price,
      guestLimit: config.guestLimit,
      guestCount,
      validityDays: config.validityDays,
      expiresAt: ev.expiresAt || null,
      isExpired: isEventExpired(ev),
      features: config.features,
      isBusiness: plan === 'business',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro' });
  }
});

export default router;
