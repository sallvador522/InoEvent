/**
 * Admin Users Routes — gestão de contas pela equipa.
 *
 * POST /api/admin/users/:id/plan    — troca plano + validade (migra o
 *                                     updateDoc client para o servidor,
 *                                     com trava de downgrade e auditoria)
 * POST /api/admin/users/:id/renew   — repõe planExpiresAt (plano atual)
 * POST /api/admin/users/:id/disable — suspende login (Auth disabled=true)
 * POST /api/admin/users/:id/enable  — reativa login
 *
 * Admin estrito (Bearer do e-mail admin). Auth via Admin SDK.
 * Suspender NÃO apaga eventos — visibilidade continua regida por isBlocked.
 */
import { Router } from 'express';
import { getDb, admin } from '../lib/firebase-admin.js';
import { apiRateLimiter } from '../middleware/index.js';
import { logAudit } from '../lib/audit.js';
import { normalizePlanId, getGuestLimit, getPlanConfig, getValidityDays, PLANS } from '../../config/plans.js';
import { backfillAccountStamps } from '../lib/billing.js';
import { getAdminAuthUser, isAdmin } from '../lib/admin-auth.js';
import { logger } from '../../lib/logger.js';

const router = Router();
const PLAN_ORDER = ['free', 'essential', 'premium', 'vip', 'business'];

// Auth centralizada (claim admin + bootstrap) — ver server/lib/admin-auth.ts.
async function getAuthUser(req: any) {
  return getAdminAuthUser(req);
}

// ---------------------------------------------------------------------------
// POST /api/admin/users/:id/plan — { plan }
// ---------------------------------------------------------------------------
router.post('/api/admin/users/:id/plan', apiRateLimiter, async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!isAdmin(authUser)) {
    return res.status(403).json({ error: 'Apenas admin' });
  }
  const id = req.params.id as string;
  const nextPlan = normalizePlanId((req.body || {}).plan);
  if (!PLANS[nextPlan as any]) return res.status(400).json({ error: 'Plano inválido' });
  try {
    const db = getDb();
    const userRef = db.collection('users').doc(id);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: 'Utilizador não encontrado' });
    const current = normalizePlanId((userSnap.data() as any)?.plan);

    // Travão de downgrade: nenhum evento do dono pode exceder a quota do destino.
    const fromIdx = PLAN_ORDER.indexOf(current);
    const toIdx = PLAN_ORDER.indexOf(nextPlan);
    if (toIdx >= 0 && fromIdx >= 0 && toIdx < fromIdx) {
      const newLimit = getGuestLimit(nextPlan);
      const owned = await db.collection('events').where('ownerId', '==', id).get();
      // Ocupação via count() em ondas de 10 (era full-scan por evento em
      // sequência). Early-exit no primeiro evento que excede a quota.
      const docs = owned.docs;
      for (let i = 0; i < docs.length; i += 10) {
        const wave = await Promise.all(
          docs.slice(i, i + 10).map(async (ev) => {
            const gref = ev.ref.collection('guests');
            const [t, declined] = await Promise.all([gref.count().get(), gref.where('status', '==', 'DECLINED').count().get()]);
            return { ev, occ: (t.data().count ?? 0) - (declined.data().count ?? 0) };
          })
        );
        for (const { ev, occ } of wave) {
          if (occ > newLimit) {
            return res.status(400).json({
              error: `"${(ev.data() as any)?.title || ev.id}" tem ${occ} convidados e o plano ${getPlanConfig(nextPlan).name} permite ${newLimit}.`,
              code: 'PLAN_DOWNGRADE_BLOCKED',
            });
          }
        }
      }
    }

    const validityDays = getValidityDays(nextPlan);
    const expiresAt = validityDays === null ? null : new Date(Date.now() + validityDays * 86400000).toISOString();
    const now = new Date().toISOString();
    await userRef.update({ plan: nextPlan, planId: nextPlan, planExpiresAt: expiresAt, updatedAt: now } as any);
    if (nextPlan !== 'free') {
      await backfillAccountStamps(id).catch(() => null);
    }
    await logAudit({
      actorEmail: authUser.email || 'admin',
      action: 'user.plan_change',
      targetType: 'user',
      targetId: id,
      detail: `${current} → ${nextPlan}`,
    });
    return res.json({ success: true, plan: nextPlan, planExpiresAt: expiresAt });
  } catch (err: any) {
    logger.error('Erro ao trocar plano', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao trocar plano' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/users/:id/renew — repõe validade do plano atual
// ---------------------------------------------------------------------------
router.post('/api/admin/users/:id/renew', apiRateLimiter, async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!isAdmin(authUser)) {
    return res.status(403).json({ error: 'Apenas admin' });
  }
  const id = req.params.id as string;
  try {
    const db = getDb();
    const userRef = db.collection('users').doc(id);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: 'Utilizador não encontrado' });
    const plan = normalizePlanId((userSnap.data() as any)?.plan);
    const days = getValidityDays(plan);
    if (days === null) return res.status(400).json({ error: 'Este plano não tem expiração.' });
    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
    await userRef.update({ planExpiresAt: expiresAt, updatedAt: new Date().toISOString() } as any);
    await logAudit({ actorEmail: authUser.email || 'admin', action: 'user.renew', targetType: 'user', targetId: id, detail: `plan=${plan} até ${expiresAt}` });
    return res.json({ success: true, planExpiresAt: expiresAt });
  } catch (err: any) {
    logger.error('Erro ao renovar validade', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao renovar' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/users/:id/disable|enable — { reason? }
// ---------------------------------------------------------------------------
async function setDisabled(req: any, res: any, disabled: boolean) {
  const authUser = await getAuthUser(req);
  if (!isAdmin(authUser)) {
    return res.status(403).json({ error: 'Apenas admin' });
  }
  const id = req.params.id as string;
  const reason = typeof (req.body || {}).reason === 'string' ? (req.body as any).reason.slice(0, 300) : '';
  try {
    await admin.auth().updateUser(id, { disabled });
    const db = getDb();
    const userRef = db.collection('users').doc(id);
    const snap = await userRef.get();
    if (snap.exists) {
      await userRef.update({
        suspendedAt: disabled ? new Date().toISOString() : null,
        suspendReason: disabled ? reason || null : null,
        updatedAt: new Date().toISOString(),
      } as any);
    }
    await logAudit({
      actorEmail: authUser.email || 'admin',
      action: disabled ? 'user.disable' : 'user.enable',
      targetType: 'user',
      targetId: id,
      detail: reason || undefined,
    });
    return res.json({ success: true, disabled });
  } catch (err: any) {
    logger.error('Erro ao suspender/reativar', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao processar conta' });
  }
}

router.post('/api/admin/users/:id/disable', apiRateLimiter, (req, res) => setDisabled(req, res, true));
router.post('/api/admin/users/:id/enable', apiRateLimiter, (req, res) => setDisabled(req, res, false));

// ---------------------------------------------------------------------------
// POST /api/admin/mirror-view — regista "ver como usuário" (readonly)
// ---------------------------------------------------------------------------
router.post('/api/admin/mirror-view', apiRateLimiter, async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!isAdmin(authUser)) return res.status(403).json({ error: 'Apenas admin' });
  const { userId } = (req.body || {}) as any;
  if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'userId obrigatório' });
  await logAudit({
    actorEmail: authUser!.email || 'admin',
    action: 'admin.mirror_view',
    targetType: 'user',
    targetId: userId,
  });
  return res.json({ success: true });
});

export default router;
