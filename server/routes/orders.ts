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
import { getAdminAuthUser, isAdmin as checkIsAdmin } from '../lib/admin-auth.js';
import { logAudit } from '../lib/audit.js';
import { normalizePlanId, PLANS, getGuestLimit, getPlanConfig } from '../../config/plans.js';
import { logger } from '../../lib/logger.js';

const router = Router();

// ---------------------------------------------------------------------------
// Helper — verifica Firebase ID token quando disponível (com claim admin)
// ---------------------------------------------------------------------------
async function getAuthUser(req: any) {
  return getAdminAuthUser(req);
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
    // Essencial aposentado (retired): fora de venda — novos pedidos recusados.
    // Pedidos pendentes antigos continuam confirmáveis via /:id/confirm (legado).
    if (planId === 'essential') {
      return res.status(403).json({
        error: 'O plano Essencial está fora de venda. Escolha o Premium para ativar o seu evento.',
        code: 'PLAN_RETIRED',
        plan: planId,
        upgradeTo: 'premium',
      });
    }
    // Plano free nunca é comprável (quota 0) — o 1º evento grátis passa
    // SÓ pela promo do assistente (/api/promo/first-event, com auditoria).
    if (planId === 'free') {
      return res.status(403).json({
        error: 'Fala com um assistente no WhatsApp para ativar o teu primeiro evento grátis.',
        code: 'PLAN_NOT_PURCHASABLE',
        plan: planId,
      });
    }

  try {
    // verifica evento existe e pertence ao user (se autenticado)
    const db = getDb();
    const evSnap = await db.collection('events').doc(eventId).get();
    if (!evSnap.exists) return res.status(404).json({ error: 'Evento não encontrado' });
    const ev = evSnap.data() as any;
    // Título denormalizado no pedido (fonte da verdade: banco, nunca o cliente)
    const eventTitle = typeof ev?.title === 'string' ? ev.title.slice(0, 100) : null;
    if (authUser && ev.ownerId !== authUser.uid) {
      // admin pode criar para outros; verifica se é admin via token email
      const isAdmin = authUser && checkIsAdmin(authUser);
      if (!isAdmin) return res.status(403).json({ error: 'Sem permissão para este evento' });
    }

    // Travão de downgrade (§10/§11): não admite pedido para plano menor que a
    // ocupação atual (recusados não contam — libertam o lugar, mesma semântica
    // da quota de RSVP). Evita ativar Essential-100 num evento com 500 pessoas.
    // Agregação server-side: conta sem descarregar nenhum documento (500 reads → 2).
    const guestsRef = db.collection('events').doc(eventId).collection('guests');
    const [totalAgg, declinedAgg] = await Promise.all([
      guestsRef.count().get(),
      guestsRef.where('status', '==', 'DECLINED').count().get(),
    ]);
    const occupying = (totalAgg.data().count ?? 0) - (declinedAgg.data().count ?? 0);
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
      eventTitle,
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
  const isAdmin = authUser && checkIsAdmin(authUser);
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
  const isAdmin = authUser && checkIsAdmin(authUser);
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
  if (!checkIsAdmin(authUser)) {
    return res.status(403).json({ error: 'Apenas admin pode confirmar pagamentos' });
  }
  try {
    const order = await confirmPayment(id, providerTransactionId);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    await logAudit({
      actorEmail: authUser.email || 'admin',
      action: 'order.confirm',
      targetType: 'order',
      targetId: id,
      detail: `plan=${order.plan} total=${order.total}Kz event=${order.eventId}`,
    });
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
  if (!checkIsAdmin(authUser)) {
    return res.status(403).json({ error: 'Apenas admin' });
  }
  try {
    await failPayment(id, reason);
    await logAudit({ actorEmail: authUser.email || 'admin', action: 'order.fail', targetType: 'order', targetId: id, detail: reason || undefined });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/backfill-accounts — carimba eventos de contas pagas (retroativos)
// Body: { userId? } para um utilizador; sem body = todas as contas pagas.
// Dry-run por omissão — escrita real SÓ com { confirm: true }.
// Admin estrito: exige Bearer de admin (sem modo dev permissivo — escrita em massa).
// ---------------------------------------------------------------------------
router.post('/api/admin/backfill-accounts', apiRateLimiter, async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!checkIsAdmin(authUser)) {
    return res.status(403).json({ error: 'Apenas admin' });
  }
  try {
    const { userId, confirm } = (req.body || {}) as any;
    if (userId && typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId inválido' });
    }
    const dryRun = confirm !== true;
    const result = await backfillAccountStamps(userId, { dryRun });
    if (!dryRun) {
      await logAudit({ actorEmail: authUser.email || 'admin', action: 'accounts.backfill', targetType: 'system', targetId: userId || 'all', metadata: result as any });
    }
    return res.json({ success: true, dryRun, ...result });
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

// ---------------------------------------------------------------------------
// POST /api/admin/backfill-order-titles — preenche eventTitle denormalizado
// em pedidos antigos (criados antes da denormalização). Admin estrito.
// Cursor pagination (500/página) + getAll em chunks de 100 + batch writes de
// 400. Dry-run por omissão — escrita real SÓ com { confirm: true }.
// ---------------------------------------------------------------------------
router.post('/api/admin/backfill-order-titles', apiRateLimiter, async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!checkIsAdmin(authUser)) {
    return res.status(403).json({ error: 'Apenas admin' });
  }
  try {
    const db = getDb();
    const { confirm } = (req.body || {}) as any;
    const dryRun = confirm !== true;
    let updated = 0;
    let skipped = 0;
    let scanned = 0;
    let lastId: string | null = null;
    for (;;) {
      let pageQ: FirebaseFirestore.Query = db.collection('orders').orderBy('__name__').limit(500);
      if (lastId) {
        const lastSnap = await db.collection('orders').doc(lastId).get();
        if (lastSnap.exists) pageQ = pageQ.startAfter(lastSnap);
      }
      const snap = await pageQ.get();
      if (snap.empty) break;
      scanned += snap.size;
      lastId = snap.docs[snap.docs.length - 1].id;

      // Candidatos: sem eventTitle + com eventId.
      const pending = snap.docs.filter((d) => {
        const data = d.data() as any;
        return !data?.eventTitle && data?.eventId;
      });
      skipped += snap.size - pending.length;
      if (pending.length === 0) {
        if (snap.size < 500) break;
        continue;
      }

      // Títulos via getAll batched (chunks de ~100), sem N round-trips.
      const eventIds = [...new Set(pending.map((d) => (d.data() as any).eventId as string))];
      const titles = new Map<string, string>();
      for (let i = 0; i < eventIds.length; i += 100) {
        const refs = eventIds.slice(i, i + 100).map((eid) => db.collection('events').doc(eid));
        const snaps = await db.getAll(...refs);
        for (const evSnap of snaps) {
          const t = evSnap.exists && typeof (evSnap.data() as any)?.title === 'string'
            ? (evSnap.data() as any).title.slice(0, 100)
            : null;
          if (t) titles.set(evSnap.id, t);
        }
      }

      if (!dryRun) {
        // Batch writes de 400 (limite Firestore: 500/op).
        const writes = pending
          .map((d) => ({ ref: d.ref, title: titles.get((d.data() as any).eventId) || null }))
          .filter((w) => w.title);
        skipped += pending.length - writes.length;
        for (let i = 0; i < writes.length; i += 400) {
          const batch = db.batch();
          for (const w of writes.slice(i, i + 400)) {
            batch.update(w.ref, { eventTitle: w.title } as any);
          }
          await batch.commit();
        }
        updated += writes.length;
      } else {
        updated += pending.filter((d) => titles.get((d.data() as any).eventId)).length;
      }
      if (snap.size < 500) break;
    }
    if (!dryRun) {
      await logAudit({ actorEmail: authUser.email || 'admin', action: 'order_titles.backfill', targetType: 'system', targetId: 'orders', metadata: { updated, skipped, scanned } });
    }
    return res.json({ success: true, dryRun, updated, skipped, scanned });
  } catch (err: any) {
    logger.error('Backfill order titles erro', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro no backfill' });
  }
});

export default router;
