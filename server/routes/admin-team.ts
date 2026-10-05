/**
 * Admin Team Routes — gestão de administradores (SÓ super-admin).
 *
 * GET  /api/admin/admins           — lista admins (espelho + claim)
 * POST /api/admin/admins/grant     — { uid | email }: concede claim + espelho
 * POST /api/admin/admins/revoke    — { uid }: remove claim + espelho
 * POST /api/admin/admins/resync    — { uid }: realinha espelho com o claim
 *
 * Travas: nunca a si próprio, nunca o e-mail principal, nunca o último admin.
 * Tudo auditado (admin.grant / admin.revoke).
 */
import { Router } from 'express';
import { getDb, admin } from '../lib/firebase-admin.js';
import { apiRateLimiter } from '../middleware/index.js';
import { getAdminAuthUser, isSuperAdmin, ADMIN_BOOTSTRAP_EMAIL } from '../lib/admin-auth.js';
import { logAudit } from '../lib/audit.js';
import { logger } from '../../lib/logger.js';

const router = Router();

async function countAdmins(): Promise<number> {
  const db = getDb();
  // Agregação: só o número interessa (era full-scan de docs de admin).
  const agg = await db.collection('users').where('role', '==', 'admin').count().get();
  return agg.data().count ?? 0;
}

async function resolveUid(input: { uid?: string; email?: string }): Promise<{ uid: string; email?: string } | null> {
  if (input.uid && typeof input.uid === 'string') {
    try {
      const rec = await admin.auth().getUser(input.uid);
      return { uid: rec.uid, email: rec.email };
    } catch {
      return null;
    }
  }
  if (input.email && typeof input.email === 'string') {
    try {
      const rec = await admin.auth().getUserByEmail(input.email.trim());
      return { uid: rec.uid, email: rec.email };
    } catch {
      return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// GET /api/admin/admins — qualquer admin vê a equipa
// ---------------------------------------------------------------------------
router.get('/api/admin/admins', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  const { isAdmin } = await import('../lib/admin-auth.js');
  if (!isAdmin(authUser)) return res.status(403).json({ error: 'Apenas admin' });
  try {
    const db = getDb();
    const snap = await db.collection('users').where('role', '==', 'admin').get();
    // Lookups Auth independentes por admin: 1 onda (era 1 RTT sequencial cada).
    // Mesma resposta, mesma sinalização de conta apagada.
    const list = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data() as any;
        let claim = false;
        try {
          const rec = await admin.auth().getUser(d.id);
          claim = (rec.customClaims as any)?.admin === true;
        } catch { /* conta apagada no Auth — sinaliza */ }
        return {
          uid: d.id,
          email: data?.email || null,
          name: data?.name || null,
          roleGrantedAt: data?.roleGrantedAt || null,
          roleGrantedBy: data?.roleGrantedBy || null,
          claim,
          inSync: claim === true,
        };
      })
    );
    return res.json({ admins: list, isSuper: isSuperAdmin(authUser) });
  } catch (err: any) {
    logger.error('Erro ao listar admins', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao listar' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/admins/grant — super-admin concede
// ---------------------------------------------------------------------------
router.post('/api/admin/admins/grant', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!isSuperAdmin(authUser)) return res.status(403).json({ error: 'Só o super-admin gere a equipa' });
  try {
    const target = await resolveUid((req.body || {}) as any);
    if (!target) return res.status(404).json({ error: 'Utilizador não encontrado (uid ou e-mail)' });
    if (target.uid === authUser!.uid) {
      return res.status(400).json({ error: 'Já és admin — não precisas conceder a ti próprio.' });
    }
    const existing = await admin.auth().getUser(target.uid).catch(() => null);
    if ((existing?.customClaims as any)?.admin === true) {
      return res.status(400).json({ error: 'Este utilizador já é admin.' });
    }
    await admin.auth().setCustomUserClaims(target.uid, { ...(existing?.customClaims || {}), admin: true });
    const now = new Date().toISOString();
    await getDb().collection('users').doc(target.uid).update({
      role: 'admin',
      roleGrantedAt: now,
      roleGrantedBy: authUser!.email || 'super-admin',
      updatedAt: now,
    } as any);
    await logAudit({
      actorEmail: authUser!.email || 'super-admin',
      action: 'admin.grant',
      targetType: 'user',
      targetId: target.uid,
      detail: target.email || undefined,
    });
    return res.json({ success: true, uid: target.uid, email: target.email || null });
  } catch (err: any) {
    logger.error('Erro ao conceder admin', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao conceder' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/admins/revoke — super-admin remove (com travas)
// ---------------------------------------------------------------------------
router.post('/api/admin/admins/revoke', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!isSuperAdmin(authUser)) return res.status(403).json({ error: 'Só o super-admin gere a equipa' });
  const { uid, reason } = (req.body || {}) as any;
  if (!uid || typeof uid !== 'string') return res.status(400).json({ error: 'uid obrigatório' });
  if (uid === authUser!.uid) {
    return res.status(400).json({ error: 'Não podes remover o teu próprio acesso.' });
  }
  try {
    const rec = await admin.auth().getUser(uid).catch(() => null);
    if (!rec) return res.status(404).json({ error: 'Utilizador não encontrado' });
    if ((rec.email || '').toLowerCase() === ADMIN_BOOTSTRAP_EMAIL) {
      return res.status(400).json({ error: 'O e-mail principal nunca perde acesso.' });
    }
    if ((await countAdmins()) <= 1) {
      return res.status(400).json({ error: 'Não podes remover o último admin.' });
    }
    const claims = { ...((rec.customClaims as any) || {}) };
    delete claims.admin;
    await admin.auth().setCustomUserClaims(uid, claims);
    const now = new Date().toISOString();
    await getDb().collection('users').doc(uid).update({
      role: null,
      roleGrantedAt: null,
      roleGrantedBy: null,
      updatedAt: now,
    } as any);
    await logAudit({
      actorEmail: authUser!.email || 'super-admin',
      action: 'admin.revoke',
      targetType: 'user',
      targetId: uid,
      detail: (typeof reason === 'string' && reason.slice(0, 300)) || rec.email || undefined,
    });
    return res.json({ success: true, uid });
  } catch (err: any) {
    logger.error('Erro ao remover admin', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao remover' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/admins/resync — realinha espelho com o claim (super)
// ---------------------------------------------------------------------------
router.post('/api/admin/admins/resync', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!isSuperAdmin(authUser)) return res.status(403).json({ error: 'Só o super-admin gere a equipa' });
  const { uid } = (req.body || {}) as any;
  if (!uid || typeof uid !== 'string') return res.status(400).json({ error: 'uid obrigatório' });
  try {
    const rec = await admin.auth().getUser(uid).catch(() => null);
    if (!rec) return res.status(404).json({ error: 'Utilizador não encontrado' });
    const hasClaim = (rec.customClaims as any)?.admin === true;
    const now = new Date().toISOString();
    await getDb().collection('users').doc(uid).update({
      role: hasClaim ? 'admin' : null,
      updatedAt: now,
    } as any);
    await logAudit({
      actorEmail: authUser!.email || 'super-admin',
      action: 'admin.resync',
      targetType: 'user',
      targetId: uid,
      detail: hasClaim ? 'claim=true' : 'claim=false',
    });
    return res.json({ success: true, uid, claim: hasClaim });
  } catch (err: any) {
    logger.error('Erro ao ressincronizar admin', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro' });
  }
});

export default router;
