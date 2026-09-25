/**
 * Orders & Billing Routes (§12, §13, §14)
 * 
 * POST   /api/orders                 — cria pedido (pending)
 * GET    /api/orders/:id             — obtém pedido
 * GET    /api/events/:id/order       — pedido do evento
 * POST   /api/orders/:id/confirm     — admin confirma pagamento (whatsapp_manual)
 * POST   /api/orders/:id/fail        — marca como failed
 * POST   /api/webhooks/payment       — webhook genérico (fonte da verdade §12)
 * POST   /api/admin/backfill-accounts — carimba eventos de contas pagas
 *
 * Renovação/upgrade: via PlansPage (novo pedido full-price); endpoints dedicados
 * removidos por falta de UI e para reduzir superfície (git history preserva).
 */
import { Router } from 'express';
import { getDb } from '../lib/firebase-admin.js';
import { apiRateLimiter } from '../middleware/index.js';
import { createOrder, getOrder, getOrderByEvent, repurposePendingOrder, confirmPayment, failPayment, backfillAccountStamps } from '../lib/billing.js';
import { normalizePlanId, PLANS, getGuestLimit, getPlanConfig } from '../../config/plans.js';
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
  // Pedidos exigem login (evita spam anónimo); se autenticado, força userId = auth uid
  if (!authUser) return res.status(401).json({ error: 'Autenticação obrigatória' });
  const effectiveUserId = authUser.uid;
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

    // Travão de downgrade (§10/§11): não admite pedido para plano menor que a
    // ocupação atual (recusados não contam — libertam o lugar, mesma semântica
    // da quota de RSVP). Evita ativar Essential-100 num evento com 500 pessoas.
    const guestsSnap = await db.collection('events').doc(eventId).collection('guests').get();
    const occupying = guestsSnap.docs.filter((d) => (d.data() as any)?.status !== 'DECLINED').length;
    const newLimit = getGuestLimit(planId);
    if (occupying > newLimit) {
      return res.status(400).json({
        error: `O evento tem ${occupying} convidados e o plano ${getPlanConfig(planId).name} permite apenas ${newLimit}. Remova convidados ou escolha um plano superior.`,
        code: 'PLAN_DOWNGRADE_BLOCKED',
        plan: planId,
        limit: newLimit,
        current: occupying,
      });
    }

    // Um pendente por evento: reaproveita (mesmo plano) ou converte (troca de plano)
    const existing = await getOrderByEvent(eventId);
    if (existing && existing.billingStatus === 'pending') {
      if (existing.plan === planId) {
        return res.json({ order: existing, reused: true });
      }
      const repurposed = await repurposePendingOrder(existing.id, planId as any);
      if (repurposed) {
        return res.json({ order: repurposed, reused: true, planChanged: true });
      }
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
// GET /api/orders/:id — só dono ou admin (antes: público, expunha valores e IDs)
// ---------------------------------------------------------------------------
router.get('/api/orders/:id', apiRateLimiter, async (req, res) => {
  const id = req.params.id as string;
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Autenticação obrigatória' });
  const order = await getOrder(id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  const isAdmin = authUser.email === 'antoniosalvador522@gmail.com';
  if (order.userId !== authUser.uid && !isAdmin) {
    return res.status(403).json({ error: 'Sem permissão para este pedido' });
  }
  return res.json({ order });
});

// ---------------------------------------------------------------------------
// GET /api/events/:id/order — só dono ou admin
// ---------------------------------------------------------------------------
router.get('/api/events/:id/order', apiRateLimiter, async (req, res) => {
  const eventId = req.params.id as string;
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Autenticação obrigatória' });
  const order = await getOrderByEvent(eventId);
  if (!order) return res.status(404).json({ error: 'Nenhum pedido para este evento' });
  const isAdmin = authUser.email === 'antoniosalvador522@gmail.com';
  if (order.userId !== authUser.uid && !isAdmin) {
    return res.status(403).json({ error: 'Sem permissão para este pedido' });
  }
  return res.json({ order });
});

// ---------------------------------------------------------------------------
// POST /api/orders/:id/confirm — confirma pagamento (admin)
// ---------------------------------------------------------------------------
router.post('/api/orders/:id/confirm', apiRateLimiter, async (req, res) => {
  const id = req.params.id as string;
  const { providerTransactionId } = req.body as any;
  const authUser = await getAuthUser(req);
  // Admin estrito: sem Bearer válido de admin, recusa (sem modo dev permissivo — ativa dinheiro)
  if (!authUser || authUser.email !== 'antoniosalvador522@gmail.com') {
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
  const authUser = await getAuthUser(req);
  if (!authUser || authUser.email !== 'antoniosalvador522@gmail.com') {
    return res.status(403).json({ error: 'Apenas admin' });
  }
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
// Exige segredo partilhado (WEBHOOK_SECRET); sem gateway configurado recusa (fail-closed).
// ---------------------------------------------------------------------------
router.post('/api/webhooks/payment', async (req, res) => {
  const { orderId, status, providerTransactionId, provider } = req.body as any;
  const secret = (req.headers['x-webhook-secret'] as string) || (req.body as any)?.secret;
  const expected = process.env.WEBHOOK_SECRET || '';
  if (!expected || secret !== expected) {
    logger.warn('[Billing] Webhook recusado (segredo inválido/ausente)', { category: 'SYSTEM' });
    return res.status(403).json({ error: 'Webhook não autorizado' });
  }
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

export default router;
