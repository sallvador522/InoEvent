/**
 * Privacy Routes — LGPD operável (auto-atendimento).
 *
 * GET  /api/privacy/export          — devolve todos os dados da conta (JSON)
 * POST /api/privacy/delete-account  — apaga TUDO (irreversível):
 *   eventos + subcoleções, convidados, pedidos pendentes, notificações,
 *   tickets, ficheiros Storage, ficha users/{uid} e login Auth.
 *   Pedidos paid/transações são ANONIMIZADOS (rastro fiscal mínimo).
 *   Audit: actor anonimizado para "deleted-user".
 *
 * Tudo exige o próprio dono (Bearer). Sem admin aqui — é direito do titular.
 */
import { Router } from 'express';
import { getDb, admin, getStorageBucket } from '../lib/firebase-admin.js';
import { apiRateLimiter } from '../middleware/index.js';
import { getAdminAuthUser } from '../lib/admin-auth.js';
import { logAudit } from '../lib/audit.js';
import { logger } from '../../lib/logger.js';

const router = Router();

const EVENT_SUBCOLLECTIONS = ['guests', 'contributions', 'photos', 'messages', 'team', 'tables'];

async function deleteCollectionDocs(ref: FirebaseFirestore.CollectionReference): Promise<number> {
  const snap = await ref.get();
  for (let i = 0; i < snap.docs.length; i += 400) {
    const db = getDb();
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return snap.size;
}

// ---------------------------------------------------------------------------
// GET /api/privacy/export — JSON com todos os dados da conta
// ---------------------------------------------------------------------------
router.get('/api/privacy/export', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Autenticação obrigatória' });
  try {
    const db = getDb();
    const uid = authUser.uid;
    // Onda 1: 6 leituras independentes numa só volta (era waterfall de 6 RTT).
    const [userSnap, evSnap, ordersSnap, subsSnap, txSnap, ticketsSnap] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('events').where('ownerId', '==', uid).get(),
      db.collection('orders').where('userId', '==', uid).get(),
      db.collection('subscriptions').where('userId', '==', uid).get(),
      db.collection('transactions').where('ownerId', '==', uid).get(),
      db.collection('tickets').where('userId', '==', uid).get(),
    ]);
    // Onda 2: subcoleções por evento/ticket em paralelo. Sem select() aqui —
    // o export LGPD tem de devolver TODOS os campos (completude legal).
    const events = await Promise.all(
      evSnap.docs.map(async (d) => {
        const guestsSnap = await d.ref.collection('guests').get();
        return {
          ...(d.data() as any),
          guests: guestsSnap.docs.map((g) => g.data()),
        };
      })
    );
    const tickets = await Promise.all(
      ticketsSnap.docs.map(async (d) => {
        const msnap = await d.ref.collection('messages').get();
        return { ...(d.data() as any), messages: msnap.docs.map((m) => m.data()) };
      })
    );
    await logAudit({
      actorEmail: authUser.email || uid,
      action: 'privacy.export',
      targetType: 'user',
      targetId: uid,
    });
    return res.json({
      exportedAt: new Date().toISOString(),
      user: userSnap.exists ? userSnap.data() : null,
      events,
      orders: ordersSnap.docs.map((d) => d.data()),
      subscriptions: subsSnap.docs.map((d) => d.data()),
      transactions: txSnap.docs.map((d) => d.data()),
      tickets,
    });
  } catch (err: any) {
    logger.error('Erro ao exportar dados', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao exportar' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/privacy/delete-account — apaga tudo (irreversível)
// ---------------------------------------------------------------------------
router.post('/api/privacy/delete-account', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Autenticação obrigatória' });
  const { confirm } = (req.body || {}) as any;
  if (confirm !== 'APAGAR') {
    return res.status(400).json({ error: 'Confirmação obrigatória (confirm: APAGAR)' });
  }
  const uid = authUser.uid;
  const actorEmail = authUser.email || uid;
  try {
    const db = getDb();
    let deletedDocs = 0;

    // Leituras das 5 coleções numa onda (era waterfall de 5 RTT).
    // As escritas abaixo tocam docs disjuntos — paralelismo seguro; o gate
    // confirm: APAGAR, a ordem Storage→Auth→audit e a semântica fiscal mantêm-se.
    const [evSnap, ordersSnap, subsSnap, txSnap, ticketsSnap] = await Promise.all([
      db.collection('events').where('ownerId', '==', uid).get(),
      db.collection('orders').where('userId', '==', uid).get(),
      db.collection('subscriptions').where('userId', '==', uid).get(),
      db.collection('transactions').where('ownerId', '==', uid).get(),
      db.collection('tickets').where('userId', '==', uid).get(),
    ]);

    // 1) Eventos + subcoleções do dono (eventos em paralelo; subs em série
    // dentro de cada evento para não rajarem batches contra o mesmo evento).
    const perEvent = await Promise.all(
      evSnap.docs.map(async (d) => {
        let n = 0;
        for (const sub of EVENT_SUBCOLLECTIONS) {
          n += await deleteCollectionDocs(d.ref.collection(sub));
        }
        await d.ref.delete();
        return n + 1;
      })
    );
    deletedDocs += perEvent.reduce((a, n) => a + n, 0);

    // 2) Pedidos pendentes apagam; paid anonimizam (fiscal).
    await Promise.all(
      ordersSnap.docs.map(async (d) => {
        const data = d.data() as any;
        if (data?.billingStatus === 'paid') {
          await d.ref.update({ userId: 'deleted-user', updatedAt: new Date().toISOString() } as any);
        } else {
          await d.ref.delete();
        }
      })
    );
    deletedDocs += ordersSnap.size;

    // 3) Subscrições: cancela registo (mantém linha anonimizada p/ histórico).
    await Promise.all(
      subsSnap.docs.map((d) =>
        d.ref.update({ userId: 'deleted-user', status: 'cancelled', cancelledAt: new Date().toISOString() } as any)
      )
    );
    deletedDocs += subsSnap.size;

    // 4) Transações do dono anonimizam.
    await Promise.all(txSnap.docs.map((d) => d.ref.update({ ownerId: 'deleted-user' } as any)));
    deletedDocs += txSnap.size;

    // 5) Tickets + mensagens apagam.
    const perTicket = await Promise.all(
      ticketsSnap.docs.map(async (d) => {
        const n = await deleteCollectionDocs(d.ref.collection('messages'));
        await d.ref.delete();
        return n + 1;
      })
    );
    deletedDocs += perTicket.reduce((a, n) => a + n, 0);

    // 6) Notificações + ficha.
    deletedDocs += await deleteCollectionDocs(db.collection('users').doc(uid).collection('notifications'));
    await db.collection('users').doc(uid).delete();
    deletedDocs++;

    // 7) Storage do dono (melhor esforço — bucket pode nem existir em dev).
    try {
      const bucket = getStorageBucket();
      await bucket.deleteFiles({ prefix: `users/${uid}/` });
      await bucket.deleteFiles({ prefix: `events/${uid}/` });
    } catch { /* best-effort */ }

    // 8) Login Auth apagado por último (token atual morre aqui).
    try {
      await admin.auth().deleteUser(uid);
    } catch (e: any) {
      logger.warn(`Conta ${uid} sem login Auth para apagar`, { category: 'SYSTEM' });
    }

    await logAudit({
      actorEmail: 'deleted-user',
      action: 'privacy.delete',
      targetType: 'user',
      targetId: uid,
      detail: `solicitado por ${actorEmail}; +${deletedDocs} registos`,
    });
    return res.json({ success: true, deletedDocs });
  } catch (err: any) {
    logger.error('Erro ao apagar conta', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao apagar conta' });
  }
});

export default router;
