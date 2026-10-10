/**
 * Promo Routes — primeiro evento grátis (Premium).
 *
 * POST /api/promo/first-event — { eventId }: SÓ admin/assistente (caminho
 *   manual via WhatsApp, preservado como fallback/override).
 * POST /api/promo/claim-first-event — { eventId }: SELF-SERVE (piloto).
 *   O próprio dono ativa, com as mesmas travas + dono==chamador +
 *   conta não-anónima + kill-switch SELF_SERVE_PROMO_ENABLED.
 *
 * Transação lógica (partilhada): verifica elegibilidade (nunca usou, dono,
 * evento free/pending, nenhuma order paid na conta) → cria order promo
 * (billingStatus paid, total 0, metadata.promo) → ativa Premium 180d,
 * publica → marca firstEventFreeUsed → audit.
 *
 * Sem isto o cliente forjaria isPublished no browser. O dono nunca escreve
 * os campos firstEventFree* (rules: fora do hasOnly).
 */
import { Router } from 'express';
import { getDb } from '../lib/firebase-admin.js';
import { apiRateLimiter, promoClaimLimiter } from '../middleware/index.js';
import { getAdminAuthUser, isAdmin as checkIsAdmin } from '../lib/admin-auth.js';
import { createOrder } from '../lib/billing.js';
import { logAudit } from '../lib/audit.js';
import { logger } from '../../lib/logger.js';
import { SELF_SERVE_PROMO_ENABLED } from '../../config/plans.js';

const router = Router();

type GrantError = { status: number; code: string; message: string };

function grantError(status: number, code: string, message: string): GrantError {
  return { status, code, message };
}

function isGrantError(e: unknown): e is GrantError {
  return !!e && typeof e === 'object' && typeof (e as any).code === 'string' && typeof (e as any).status === 'number';
}

// ---------------------------------------------------------------------------
// Núcleo partilhado: elegibilidade + ativação (admin e self-serve usam igual)
// ---------------------------------------------------------------------------
async function grantFirstEventFree(
  db: FirebaseFirestore.Firestore,
  ownerId: string,
  eventId: string,
  grantedBy: string,
): Promise<{ orderId: string }> {
  const evRef = db.collection('events').doc(eventId);
  const evSnap = await evRef.get();
  if (!evSnap.exists) throw grantError(404, 'EVENT_NOT_FOUND', 'Evento não encontrado');
  const ev = evSnap.data() as any;
  const actualOwner = ev.ownerId as string;
  if (!actualOwner) throw grantError(400, 'EVENT_NO_OWNER', 'Evento sem dono');
  if (actualOwner !== ownerId) throw grantError(403, 'NOT_OWNER', 'Este evento não pertence a esta conta.');

  // Elegibilidade: nunca usou + evento ainda free/pending.
  const userRef = db.collection('users').doc(ownerId);
  const userSnap = await userRef.get();
  const udata = (userSnap.exists ? userSnap.data() : {}) as any;
  if (udata?.firstEventFreeUsed === true) {
    throw grantError(400, 'PROMO_ALREADY_USED', 'Esta conta já usou o primeiro evento grátis.');
  }
  if ((ev as any)?.billingStatus === 'paid') {
    throw grantError(400, 'EVENT_ALREADY_PAID', 'Este evento já está pago.');
  }
  if (['BRIDAL_SHOWER', 'BABY_SHOWER'].includes((ev as any)?.type)) {
    throw grantError(400, 'PROMO_NOT_NEEDED', 'Chás já são livres — a promo é para casamentos.');
  }
  // Conta velha a passar-se por nova: qualquer order paid bloqueia.
  const paidSnap = await db.collection('orders').where('userId', '==', ownerId).where('billingStatus', '==', 'paid').limit(1).get();
  if (!paidSnap.empty) {
    throw grantError(400, 'PROMO_NOT_ELIGIBLE', 'Esta conta já tem um plano pago.');
  }

  // Cria order promo (valor 0) e ativa pelo caminho dedicado (confirmPayment
  // faria early-return em paid — ver nota original preservada abaixo).
  const order = await createOrder({ userId: ownerId, eventId, eventTitle: (ev as any)?.title || null, plan: 'premium' as any, addons: {} });
  const now = new Date().toISOString();
  await db.collection('orders').doc(order.id).update({
    billingStatus: 'paid',
    paidAt: now,
    amount: 0,
    total: 0,
    subtotal: 0,
    paymentProvider: 'promo_first_event',
    metadata: { promo: 'first_event_free', grantedBy },
  } as any);
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
  // Writes em chunks de 400 — um batch único rebenta acima de 500 eventos.
  try {
    const owned = await db.collection('events').where('ownerId', '==', ownerId).get();
    const siblings = owned.docs.filter((d) => d.id !== eventId);
    for (let i = 0; i < siblings.length; i += 400) {
      const batch = db.batch();
      siblings.slice(i, i + 400).forEach((d) => {
        batch.update(d.ref, {
          accountActive: true,
          accountExpiresAt: expiresAt ? expiresAt.toISOString() : null,
          updatedAt: now,
        } as any);
      });
      await batch.commit();
    }
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
    actorEmail: grantedBy,
    action: 'promo.first_event',
    targetType: 'event',
    targetId: eventId,
    detail: `order=${order.id} owner=${ownerId}`,
  });
  logger.success(`Promo 1º evento grátis: event=${eventId} owner=${ownerId} by=${grantedBy}`, { category: 'SYSTEM' });
  return { orderId: order.id };
}

function validEventId(eventId: unknown): boolean {
  return typeof eventId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(eventId);
}

// ---------------------------------------------------------------------------
// POST /api/promo/first-event — { eventId } — SÓ admin/assistente
// ---------------------------------------------------------------------------
router.post('/api/promo/first-event', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!checkIsAdmin(authUser)) return res.status(403).json({ error: 'Apenas equipa InoEvents' });
  const { eventId } = (req.body || {}) as any;
  if (!validEventId(eventId)) {
    return res.status(400).json({ error: 'eventId inválido' });
  }
  try {
    const db = getDb();
    // Admin pode ativar por terceiros: o dono é o do evento, não o chamador.
    const evSnap = await db.collection('events').doc(eventId as string).get();
    if (!evSnap.exists) return res.status(404).json({ error: 'Evento não encontrado' });
    const ownerId = (evSnap.data() as any)?.ownerId as string;
    if (!ownerId) return res.status(400).json({ error: 'Evento sem dono' });
    const { orderId } = await grantFirstEventFree(db, ownerId, eventId as string, authUser!.email || 'admin');
    return res.json({ success: true, eventId, orderId });
  } catch (err: any) {
    if (isGrantError(err)) return res.status(err.status).json({ error: err.message, code: err.code });
    logger.error('Erro na promo primeiro evento', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao ativar promo' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/promo/claim-first-event — { eventId } — SELF-SERVE (piloto)
// O próprio dono ativa. Travas extra: kill-switch, dono==chamador,
// conta não-anónima. Sem e-mail verificado por agora (monitorizar farming).
// ---------------------------------------------------------------------------
router.post('/api/promo/claim-first-event', promoClaimLimiter, async (req, res) => {
  if (!SELF_SERVE_PROMO_ENABLED) {
    return res.status(403).json({ error: 'Ativação automática indisponível de momento. Fale connosco no WhatsApp.', code: 'SELF_SERVE_DISABLED' });
  }
  const authUser = await getAdminAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Autenticação obrigatória', code: 'UNAUTHENTICATED' });
  if (authUser.signInProvider === 'anonymous' || (!authUser.email && !authUser.emailVerified)) {
    // Contas anónimas (sem e-mail no token) não ativam sozinhas — passam pelo assistente.
    return res.status(403).json({ error: 'Esta ativação pede uma conta com e-mail ou Google. Fale connosco no WhatsApp.', code: 'ANONYMOUS_NOT_ALLOWED' });
  }
  const { eventId } = (req.body || {}) as any;
  if (!validEventId(eventId)) {
    return res.status(400).json({ error: 'eventId inválido' });
  }
  try {
    const db = getDb();
    // grantFirstEventFree já recusa se o evento não for do chamador (NOT_OWNER).
    const { orderId } = await grantFirstEventFree(db, authUser.uid, eventId as string, 'self-serve');
    return res.json({ success: true, eventId, orderId });
  } catch (err: any) {
    if (isGrantError(err)) return res.status(err.status).json({ error: err.message, code: err.code });
    logger.error('Erro na promo self-serve', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao ativar promo' });
  }
});

export default router;
