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
  eventTitle?: string | null;
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
    eventTitle: typeof input.eventTitle === 'string' ? input.eventTitle.slice(0, 100) : null,
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
  // Sem orderBy (evita índice composto): ordena em código, devolve o mais recente.
  // Teto 20 — pedidos por evento são escassos; nunca varre histórico sem limite.
  const q = await db.collection('orders').where('eventId', '==', eventId).limit(20).get();
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
  // Teto 500 — pedidos por utilizador são escassos; nunca sem limite.
  const snap = await db.collection('orders').where('userId', '==', userId).limit(500).get();
  return snap.docs.map(d => d.data() as Order);
}

/** Carimba accountActive em todos os eventos do dono, em batches de 400
 * (um batch único rebenta acima de 500 eventos — limite Firestore: 500/op). */
async function stampOwnedEvents(
  db: FirebaseFirestore.Firestore,
  userId: string,
  patch: Record<string, unknown>
): Promise<number> {
  const owned = await db.collection('events').where('ownerId', '==', userId).get();
  for (let i = 0; i < owned.docs.length; i += 400) {
    const batch = db.batch();
    owned.docs.slice(i, i + 400).forEach((d) => batch.update(d.ref, patch as any));
    await batch.commit();
  }
  return owned.size;
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
    // Rede de segurança por agregação (era full-scan): conta sem descarregar docs.
    const gref = db.collection('events').doc(order.eventId).collection('guests');
    const [gTotal, gDeclined] = await Promise.all([gref.count().get(), gref.where('status', '==', 'DECLINED').count().get()]);
    const occ = (gTotal.data().count ?? 0) - (gDeclined.data().count ?? 0);
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
    const stamped = await stampOwnedEvents(db, order.userId, {
      accountActive: true,
      accountExpiresAt,
      updatedAt: now,
    });
    logger.success(`Conta activada user=${order.userId} plan=${plan} eventos=${stamped}`, { category: 'SYSTEM' });
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
export async function backfillAccountStamps(userId?: string, opts?: { dryRun?: boolean }): Promise<{ users: number; events: number; scanned: number }> {
  const db = getDb();
  const dryRun = opts?.dryRun !== false;
  // Cursor pagination over users (500/page) — never full-collection scan.
  const candidates: { id: string; plan: string; accountExpiresAt: string | null }[] = [];
  let scanned = 0;
  if (userId) {
    const one = await db.collection('users').doc(userId).get();
    scanned = 1;
    if (one.exists) {
      const data = one.data() as any;
      candidates.push({ id: one.id, plan: normalizePlanId(data?.plan ?? data?.planId), accountExpiresAt: data?.planExpiresAt || null });
    }
  } else {
    let lastId: string | null = null;
    for (;;) {
      let pageQ: FirebaseFirestore.Query = db.collection('users').orderBy('__name__').limit(500);
      if (lastId) {
        const lastSnap = await db.collection('users').doc(lastId).get();
        if (lastSnap.exists) pageQ = pageQ.startAfter(lastSnap);
      }
      const snap = await pageQ.get();
      if (snap.empty) break;
      scanned += snap.size;
      lastId = snap.docs[snap.docs.length - 1].id;
      for (const d of snap.docs) {
        const data = d.data() as any;
        candidates.push({ id: d.id, plan: normalizePlanId(data?.plan ?? data?.planId), accountExpiresAt: data?.planExpiresAt || null });
      }
      if (snap.size < 500) break;
    }
  }
  // Keep only paid plans; business requires a live subscription.
  // Sub checks in waves of 10 (not N sequential round-trips).
  const targets: typeof candidates = [];
  const business = candidates.filter((c) => c.plan === 'business');
  const businessOk = new Set<string>();
  for (let i = 0; i < business.length; i += 10) {
    const wave = await Promise.all(
      business.slice(i, i + 10).map(async (c) => ({ id: c.id, ok: !!(await getActiveSubscription(c.id).catch(() => null)) }))
    );
    for (const w of wave) {
      if (w.ok) businessOk.add(w.id);
      else logger.warn(`Backfill ignorado (business sem subscrição viva): user=${w.id}`, { category: 'SYSTEM' });
    }
  }
  for (const c of candidates) {
    if (c.plan !== 'essential' && c.plan !== 'premium' && c.plan !== 'vip' && c.plan !== 'business') continue;
    if (c.plan === 'business' && !businessOk.has(c.id)) continue;
    targets.push(c);
  }
  let stamped = 0;
  for (const u of targets) {
    const owned = await db.collection('events').where('ownerId', '==', u.id).get();
    if (owned.empty) continue;
    if (dryRun) {
      stamped += owned.size;
      continue;
    }
    // Batch writes chunked at 400 (Firestore limit: 500/op — the old code
    // put ALL owned docs in one batch and blew up past 500 events).
    const nowIso = new Date().toISOString();
    for (let i = 0; i < owned.docs.length; i += 400) {
      const batch = db.batch();
      owned.docs.slice(i, i + 400).forEach((d) => {
        batch.update(d.ref, {
          accountActive: true,
          accountExpiresAt: u.accountExpiresAt,
          updatedAt: nowIso,
        } as any);
      });
      await batch.commit();
    }
    stamped += owned.size;
  }
  logger.success(`Backfill contas${dryRun ? ' (dry-run)' : ''}: users=${targets.length} eventos=${stamped} scanned=${scanned}`, { category: 'SYSTEM' });
  return { users: targets.length, events: stamped, scanned };
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
    await stampOwnedEvents(db, userId, { accountActive: true, accountExpiresAt: null, updatedAt: now.toISOString() });
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
      await stampOwnedEvents(db, userId, {
        accountActive: false,
        scheduledBlockDate: periodEnd.toISOString(),
        updatedAt: now.toISOString(),
      });
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
      await stampOwnedEvents(db, userId, {
        accountActive: true,
        accountExpiresAt: null,
        scheduledBlockDate: null,
        updatedAt: now.toISOString(),
      });
    } catch { void 0; }
  }
  const updated = await ref.get();
  return (updated.data() as Subscription) ?? null;
}
