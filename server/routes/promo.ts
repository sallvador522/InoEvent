/**
 * Promo Routes — primeiro evento grátis (Premium, via assistente).
 *
 * POST /api/promo/first-event — { eventId }: SÓ admin/assistente.
 *   Transação lógica: verifica elegibilidade (nunca usou, dono, evento
 *   free/pending, nenhuma order paid na conta) → cria order promo
 *   (billingStatus paid, total 0, metadata.promo) → confirmPayment
 *   (Premium 180d, publica) → marca firstEventFreeUsed → audit.
 *
 * Sem isto o cliente forjaria isPublished no browser. O dono nunca escreve
 * os campos firstEventFree* (rules: fora do hasOnly).
 */
import { Router } from 'express';
import { getDb } from '../lib/firebase-admin.js';
import { apiRateLimiter } from '../middleware/index.js';
import { getAdminAuthUser, isAdmin as checkIsAdmin } from '../lib/admin-auth.js';
import { createOrder, confirmPayment } from '../lib/billing.js';
import { logAudit } from '../lib/audit.js';
import { logger } from '../../lib/logger.js';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/promo/first-event — { eventId }
// ---------------------------------------------------------------------------
router.post('/api/promo/first-event', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!checkIsAdmin(authUser)) return res.status(403).json({ error: 'Apenas equipa InoEvents' });
  const { eventId } = (req.body || {}) as any;
  if (!eventId || typeof eventId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(eventId)) {
    return res.status(400).json({ error: 'eventId inválido' });
  }
  try {
    const db = getDb();
    const evRef = db.collection('events').doc(eventId);
    const evSnap = await evRef.get();
    if (!evSnap.exists) return res.status(404).json({ error: 'Evento não encontrado' });
    const ev = evSnap.data() as any;
    const ownerId = ev.ownerId as string;
    if (!ownerId) return res.status(400).json({ error: 'Evento sem dono' });

    // Elegibilidade: nunca usou + evento ainda free/pending.
    const userRef = db.collection('users').doc(ownerId);
    const userSnap = await userRef.get();
    const udata = (userSnap.exists ? userSnap.data() : {}) as any;
    if (udata?.firstEventFreeUsed === true) {
      return res.status(400).json({ error: 'Esta conta já usou o primeiro evento grátis.', code: 'PROMO_ALREADY_USED' });
    }
    if ((ev as any)?.billingStatus === 'paid') {
      return res.status(400).json({ error: 'Este evento já está pago.', code: 'EVENT_ALREADY_PAID' });
    }
    if (['BRIDAL_SHOWER', 'BABY_SHOWER'].includes((ev as any)?.type)) {
      return res.status(400).json({ error: 'Chás já são livres — a promo é para casamentos.', code: 'PROMO_NOT_NEEDED' });
    }
    // Conta velha a passar-se por nova: qualquer order paid bloqueia.
    const paidSnap = await db.collection('orders').where('userId', '==', ownerId).where('billingStatus', '==', 'paid').limit(1).get();
    if (!paidSnap.empty) {
      return res.status(400).json({ error: 'Esta conta já tem um plano pago.', code: 'PROMO_NOT_ELIGIBLE' });
    }

    // Cria order promo (valor 0) e confirma pelo caminho oficial.
    const order = await createOrder({ userId: ownerId, eventId, eventTitle: (ev as any)?.title || null, plan: 'premium' as any, addons: {} });
    const now = new Date().toISOString();
    await db.collection('orders').doc(order.id).update({
      billingStatus: 'paid',
      paidAt: now,
      amount: 0,
      total: 0,
      subtotal: 0,
      paymentProvider: 'promo_first_event',
      metadata: { promo: 'first_event_free', grantedBy: authUser!.email || 'admin' },
    } as any);
    // confirmPayment parte de pending→paid; como já marcámos paid, ele retorna
    // o pedido sem re-carimbar — por isso ativamos via caminho dedicado abaixo.
    // (Não reutilizar confirmPayment aqui: ele faria early-return em paid.)
    const { calculateExpiresAt } = await import('../../config/plans.js');
    const expiresAt = calculateExpiresAt('premium', new Date(now));
    await evRef.update({
      plan: 'premium',
      planId: 'premium',
      billingStatus: 'paid',
      status: 'active',
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      publishedAt: now,
      isPublished: true,
      isBlocked: false,
      orderId: order.id,
      updatedAt: now,
    } as any);
    await userRef.update({
      plan: 'premium',
      planId: 'premium',
      planExpiresAt: expiresAt ? expiresAt.toISOString() : null,
      accountActive: true,
      accountExpiresAt: expiresAt ? expiresAt.toISOString() : null,
      firstEventFreeUsed: true,
      firstEventFreeEventId: eventId,
      firstEventFreeAt: now,
      updatedAt: now,
    } as any);
    // Carimba eventos irmãos como conta ativa (mesma semântica do confirmPayment).
    try {
      const owned = await db.collection('events').where('ownerId', '==', ownerId).get();
      const batch = db.batch();
      owned.docs.forEach((d) => {
        if (d.id === eventId) return;
        batch.update(d.ref, {
          accountActive: true,
          accountExpiresAt: expiresAt ? expiresAt.toISOString() : null,
          updatedAt: now,
        } as any);
      });
      await batch.commit();
    } catch { /* best-effort */ }

    try {
      await db.collection('users').doc(ownerId).collection('notifications').add({
        title: 'Presente InoEvents 🎉',
        message: 'O teu primeiro evento foi ativado GRÁTIS em Premium! Já podes partilhar o convite.',
        createdAt: now,
        read: false,
        type: 'plan_upgrade',
      });
    } catch { /* best-effort */ }

    await logAudit({
      actorEmail: authUser!.email || 'admin',
      action: 'promo.first_event',
      targetType: 'event',
      targetId: eventId,
      detail: `order=${order.id} owner=${ownerId}`,
    });
    logger.success(`Promo 1º evento grátis: event=${eventId} owner=${ownerId}`, { category: 'SYSTEM' });
    return res.json({ success: true, eventId, orderId: order.id });
  } catch (err: any) {
    logger.error('Erro na promo primeiro evento', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao ativar promo' });
  }
});

export default router;
