/**
 * Billing — Orders e Subscriptions (§12, §13, §16)
 * 
 * Entidades são fonte da verdade. Nunca `isPaid=true` isolado.
 * Webhook é fonte da verdade quando gateway existir; hoje confirmação é manual via admin.
 */
import { getDb } from './firebase-admin.js';
import { PLANS, ADDONS, normalizePlanId, calculateOrderTotal, calculateExpiresAt, getGuestLimit, getPlanConfig } from '../../config/plans.js';
import { logger } from '../../lib/logger.js';
import type { Order, Subscription, PlanId, BillingStatus } from '../../types.js';

export type CreateOrderInput = {
  userId: string;
  eventId: string;
  plan: PlanId;
  addons?: { concierge?: boolean };
  paymentProvider?: Order['paymentProvider'];
  organizationId?: string | null;
};

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const db = getDb();
  const plan = normalizePlanId(input.plan) as PlanId;
  const planConfig = PLANS[plan];
  const addons = input.addons || {};
  const total = calculateOrderTotal(plan, addons as any);
  const subtotal = planConfig.price;

  const id = `ord_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const order: Order = {
    id,
    userId: input.userId,
    organizationId: input.organizationId || null,
    eventId: input.eventId,
    plan,
    amount: total,
    currency: 'AOA',
    billingStatus: 'pending',
    paymentProvider: input.paymentProvider || 'whatsapp_manual',
    providerTransactionId: null,
    addons,
    subtotal,
    total,
    createdAt: now,
    paidAt: null,
    metadata: {},
  };

  await db.collection('orders').doc(id).set(order);
  logger.info(`Order criado ${id} plan=${plan} total=${total}Kz`, { category: 'SYSTEM' });
  return order;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const db = getDb();
  const snap = await db.collection('orders').doc(orderId).get();
  if (!snap.exists) return null;
  return snap.data() as Order;
}

export async function getOrderByEvent(eventId: string): Promise<Order | null> {
  const db = getDb();
  // Sem orderBy (evita índice composto): ordena em código, devolve o mais recente
  const q = await db.collection('orders').where('eventId', '==', eventId).get();
  if (q.empty) return null;
  const sorted = q.docs
    .map((d) => d.data() as Order)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return sorted[0] || null;
}

/** Reaproveita pedido pendente ao trocar de plano (1 pendente por evento, sem duplicados). */
export async function repurposePendingOrder(orderId: string, plan: PlanId): Promise<Order | null> {
  const db = getDb();
  const ref = db.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const order = snap.data() as Order;
  if (order.billingStatus !== 'pending') return null;
  const total = calculateOrderTotal(plan, (order.addons as any) || {});
  const patch = {
    plan,
    subtotal: PLANS[plan].price,
    total,
    amount: total,
  } as any;
  await ref.update(patch);
  return { ...order, ...patch } as Order;
}

export async function listOrdersByUser(userId: string): Promise<Order[]> {
  const db = getDb();
  const snap = await db.collection('orders').where('userId', '==', userId).get();
  return snap.docs.map(d => d.data() as Order);
}

/** Confirma pagamento — só após validação (admin ou webhook) §12 */
export async function confirmPayment(orderId: string, providerTxId?: string): Promise<Order | null> {
  const db = getDb();
  const ref = db.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const order = snap.data() as Order;
  if (order.billingStatus === 'paid') return order;

  const now = new Date().toISOString();
  const paidOrder: Partial<Order> = {
    billingStatus: 'paid',
    paidAt: now,
    providerTransactionId: providerTxId || order.providerTransactionId || null,
  };
  await ref.update(paidOrder as any);

  // Atualiza evento: status, expiresAt, billingStatus
  const plan = order.plan;
  const expiresAt = calculateExpiresAt(plan, new Date(now));
  // Marca da agência (white-label B2B): carimbada da ficha do dono.
  let whiteLabelName: string | null = null;
  let whiteLabelLogo: string | null = null;
  try {
    const ownerSnap = await db.collection('users').doc(order.userId).get();
    const od = ownerSnap.exists ? (ownerSnap.data() as any) : {};
    whiteLabelName = typeof od?.whiteLabelName === 'string' ? od.whiteLabelName : null;
    whiteLabelLogo = typeof od?.whiteLabelLogo === 'string' ? od.whiteLabelLogo : null;
  } catch { /* sem marca — segue o jogo */ }
  // Rede de segurança (§10/§11): a criação do pedido já trava downgrade acima da
  // quota, mas se mesmo assim chegar aqui (fluxo antigo/manual), ativa na mesma
  // — dinheiro recebido não se devolve por isto — e regista aviso para o admin.
  try {
    const gSnap = await db.collection('events').doc(order.eventId).collection('guests').get();
    const occ = gSnap.docs.filter((d) => (d.data() as any)?.status !== 'DECLINED').length;
    const lim = getGuestLimit(plan);
    if (occ > lim) {
      logger.warn(`Downgrade acima da quota: evento ${order.eventId} tem ${occ} convidados para o plano ${getPlanConfig(plan).name} (${lim}). Ativado na mesma — rever manualmente.`, { category: 'SYSTEM' });
    }
  } catch { /* best-effort */ }
  try {
    const eventRef = db.collection('events').doc(order.eventId);
    const eventSnap = await eventRef.get();
    if (eventSnap.exists) {
      await eventRef.update({
        plan: plan, // canónico em minúsculo; legado normalizado no read
        planId: plan,
        billingStatus: 'paid',
        status: 'active',
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        publishedAt: now,
        isPublished: true,
        isBlocked: false,
        orderId: order.id,
        updatedAt: now,
        whiteLabelName,
        whiteLabelLogo,
      } as any);
    }
  } catch (e) {
    logger.error(`Falha ao activar evento após pagamento ${orderId}`, { category: 'DATABASE', data: e });
  }

  // Ativa a CONTA: plano pago publica todos os eventos do dono (com validade do plano).
  // Retrocompatível: planExpiresAt null (atribuído manualmente) conta como válido.
  try {
    const accountExpiresAt = calculateExpiresAt(plan, new Date(now));
    await db.collection('users').doc(order.userId).update({
      plan: plan,
      planId: plan,
      planExpiresAt: accountExpiresAt ? accountExpiresAt.toISOString() : null,
      updatedAt: now,
    } as any);
    // Carimba todos os eventos do dono para leitura event-local (sem fetch extra no convidado)
    const owned = await db.collection('events').where('ownerId', '==', order.userId).get();
    const batch = db.batch();
    owned.docs.forEach((d) => {
      batch.update(d.ref, {
        accountActive: true,
        accountExpiresAt: accountExpiresAt ? accountExpiresAt.toISOString() : null,
        updatedAt: now,
      } as any);
    });
    await batch.commit();
    logger.success(`Conta activada user=${order.userId} plan=${plan} eventos=${owned.size}`, { category: 'SYSTEM' });
  } catch (e) {
    logger.error(`Falha ao activar conta após pagamento ${orderId}`, { category: 'DATABASE', data: e });
  }

  logger.success(`Pagamento confirmado order=${orderId} event=${order.eventId}`, { category: 'SYSTEM' });
  return { ...order, ...paidOrder } as Order;
}

/**
 * Backfill conta activa — carimba eventos de utilizadores com plano pago.
 * Uso: uma vez (retroativos) + após troca manual de plano no admin.
 * Mantém planExpiresAt existente (null = válido, sem inventar validades).
 * Business SÓ com subscrição viva — sem ela, não eterniza (antes carimbava
 * vitalício para qualquer users.plan='business').
 */
export async function backfillAccountStamps(userId?: string): Promise<{ users: number; events: number }> {
  const db = getDb();
  const allUsers = await db.collection('users').get();
  const targets: typeof allUsers.docs = [];
  for (const d of allUsers.docs) {
    if (userId && d.id !== userId) continue;
    const data = d.data() as any;
    const p = normalizePlanId(data?.plan ?? data?.planId);
    if (p !== 'essential' && p !== 'premium' && p !== 'vip' && p !== 'business') continue;
    if (p === 'business') {
      const sub = await getActiveSubscription(d.id).catch(() => null);
      if (!sub) {
        logger.warn(`Backfill ignorado (business sem subscrição viva): user=${d.id}`, { category: 'SYSTEM' });
        continue;
      }
    }
    targets.push(d);
  }
  let stamped = 0;
  for (const u of targets) {
    const accountExpiresAt: string | null = (u.data() as any)?.planExpiresAt || null;
    const owned = await db.collection('events').where('ownerId', '==', u.id).get();
    if (owned.empty) continue;
    const batch = db.batch();
    const nowIso = new Date().toISOString();
    owned.docs.forEach((d) => {
      batch.update(d.ref, {
        accountActive: true,
        accountExpiresAt,
        updatedAt: nowIso,
      } as any);
    });
    await batch.commit();
    stamped += owned.size;
  }
  logger.success(`Backfill contas: users=${targets.length} eventos=${stamped}`, { category: 'SYSTEM' });
  return { users: targets.length, events: stamped };
}

export async function failPayment(orderId: string, reason?: string): Promise<void> {
  const db = getDb();
  await db.collection('orders').doc(orderId).update({
    billingStatus: 'failed',
    metadata: { failureReason: reason || 'unknown' },
  } as any);
}

export async function refundOrder(orderId: string): Promise<void> {
  const db = getDb();
  await db.collection('orders').doc(orderId).update({
    billingStatus: 'refunded',
    metadata: { refundedAt: new Date().toISOString() },
  } as any);
  // §12 política: refund não apaga dados, mas bloqueia entitlements — tratar via isEventActive
}

// ---------------------------------------------------------------------------
// Subscriptions — Business (§16)
// ---------------------------------------------------------------------------

export async function createSubscription(userId: string, plan: Extract<PlanId, 'business'> = 'business'): Promise<Subscription> {
  const db = getDb();
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  const id = `sub_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
  const sub: Subscription = {
    id,
    userId,
    organizationId: null,
    plan,
    status: 'active',
    price: PLANS.business.price,
    currency: 'AOA',
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    createdAt: now.toISOString(),
    cancelledAt: null,
  };
  await db.collection('subscriptions').doc(id).set(sub as any);
  // também actualiza users/{uid}.plan para compat
  try {
    await db.collection('users').doc(userId).update({
      plan: 'business',
      planId: 'business',
      subscriptionId: id,
      updatedAt: now.toISOString(),
    } as any);
  } catch { void 0; }
  // Nascimento completo: carimba eventos do dono como ativos (antes o doc nascia
  // e os eventos ficavam não-coletáveis até intervenção manual).
  try {
    const owned = await db.collection('events').where('ownerId', '==', userId).get();
    const batch = db.batch();
    owned.docs.forEach((d) => {
      batch.update(d.ref, { accountActive: true, accountExpiresAt: null, updatedAt: now.toISOString() } as any);
    });
    await batch.commit();
  } catch { void 0; }
  return sub;
}

export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const db = getDb();
  const q = await db.collection('subscriptions').where('userId', '==', userId).where('status', '==', 'active').limit(1).get();
  if (q.empty) return null;
  const sub = q.docs[0].data() as Subscription;
  // verifica expiração
  if (new Date(sub.currentPeriodEnd) < new Date()) return null;
  return sub;
}

export async function hasActiveBusinessSubscription(userId: string): Promise<boolean> {
  const sub = await getActiveSubscription(userId);
  return !!sub;
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const db = getDb();
  const ref = db.collection('subscriptions').doc(subscriptionId);
  const snap = await ref.get();
  const now = new Date();
  // Graça de 7 dias: vale até ao fim do pago ou +7 dias (o que for maior).
  // A data estendida é a única fonte — o gate consulta a subscrição viva.
  let periodEnd = new Date(now.getTime() + 7 * 86400000);
  let userId: string | null = null;
  if (snap.exists) {
    const data = snap.data() as any;
    userId = data?.userId || null;
    const prev = data?.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null;
    if (prev && !isNaN(prev.getTime())) {
      const extended = new Date(Math.max(prev.getTime(), now.getTime()) + 7 * 86400000);
      periodEnd = extended;
    }
  }
  await ref.update({
    status: 'cancelled',
    cancelledAt: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
  } as any);
  // Corte suave: agenda o bloqueio dos eventos para o fim da graça
  // (scheduledBlockDate já é respeitado por isEventExpired) e baixa a conta.
  if (userId) {
    try {
      await db.collection('users').doc(userId).update({
        plan: 'free',
        planId: 'free',
        updatedAt: now.toISOString(),
      } as any);
    } catch { void 0; }
    try {
      const owned = await db.collection('events').where('ownerId', '==', userId).get();
      const batch = db.batch();
      owned.docs.forEach((d) => {
        batch.update(d.ref, {
          accountActive: false,
          scheduledBlockDate: periodEnd.toISOString(),
          updatedAt: now.toISOString(),
        } as any);
      });
      await batch.commit();
    } catch { void 0; }
  }
}

/**
 * Renovar mensalidade (admin, ciclo manual): +30 dias a partir do maior entre
 * agora e o fim vigente; reativa conta e eventos; limpa o bloqueio agendado.
 */
export async function renewSubscription(subscriptionId: string): Promise<Subscription | null> {
  const db = getDb();
  const ref = db.collection('subscriptions').doc(subscriptionId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as any;
  const now = new Date();
  const prev = data?.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null;
  const base = prev && !isNaN(prev.getTime()) && prev.getTime() > now.getTime() ? prev.getTime() : now.getTime();
  const periodEnd = new Date(base + 30 * 86400000);
  await ref.update({
    status: 'active',
    cancelledAt: null,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
  } as any);
  const userId = data?.userId as string | undefined;
  if (userId) {
    try {
      await db.collection('users').doc(userId).update({
        plan: 'business',
        planId: 'business',
        subscriptionId,
        updatedAt: now.toISOString(),
      } as any);
    } catch { void 0; }
    try {
      const owned = await db.collection('events').where('ownerId', '==', userId).get();
      const batch = db.batch();
      owned.docs.forEach((d) => {
        batch.update(d.ref, {
          accountActive: true,
          accountExpiresAt: null,
          scheduledBlockDate: null,
          updatedAt: now.toISOString(),
        } as any);
      });
      await batch.commit();
    } catch { void 0; }
  }
  const updated = await ref.get();
  return (updated.data() as Subscription) ?? null;
}
