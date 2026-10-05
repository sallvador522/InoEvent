/**
 * Admin Events Routes — ativação/desativação manual de eventos.
 *
 * POST /api/admin/events/:id/block    — desativa (bloqueia o convite público)
 * POST /api/admin/events/:id/activate — ativa E publica (isBlocked=false + isPublished=true)
 *
 * Admin estrito: exige Bearer do e-mail admin (sem modo dev permissivo —
 * mexe em visibilidade pública). Usa Admin SDK (bypassa firestore.rules,
 * que proíbe clientes de tocarem em isBlocked).
 *
 * Nota: Ativar aqui NÃO mexe em billingStatus/order (verdade financeira fica
 * no confirmPayment). Apenas libera visibilidade: desbloqueia + publica.
 */
import { Router } from 'express';
import { getDb, getStorageBucket } from '../lib/firebase-admin.js';
import { apiRateLimiter } from '../middleware/index.js';
import { logAudit } from '../lib/audit.js';
import { getAdminAuthUser, isAdmin as requireAdmin } from '../lib/admin-auth.js';
import { logger } from '../../lib/logger.js';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/admin/events/:id/block
// ---------------------------------------------------------------------------
router.post('/api/admin/events/:id/block', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!requireAdmin(authUser)) return res.status(403).json({ error: 'Apenas admin' });
  const id = req.params.id as string;
  if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return res.status(400).json({ error: 'ID de evento inválido' });
  }
  const { reason, blockedTitle, blockedMessage } = (req.body || {}) as any;
  try {
    const db = getDb();
    const ref = db.collection('events').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Evento não encontrado' });
    const now = new Date().toISOString();
    const patch: Record<string, any> = {
      isBlocked: true,
      status: 'blocked',
      updatedAt: now,
    };
    if (typeof blockedTitle === 'string' && blockedTitle.slice(0, 120)) {
      patch.blockedTitle = blockedTitle.slice(0, 120);
    }
    if (typeof blockedMessage === 'string' && blockedMessage.slice(0, 500)) {
      patch.blockedMessage = blockedMessage.slice(0, 500);
    } else if (typeof reason === 'string' && reason.slice(0, 500)) {
      patch.blockedMessage = reason.slice(0, 500);
    }
    await ref.update(patch);
    logger.warn(`Evento desativado pelo admin ${id}`, { category: 'SYSTEM' });
    await logAudit({ actorEmail: authUser?.email || 'admin', action: 'event.block', targetType: 'event', targetId: id, detail: (patch.blockedMessage as string) || undefined });
    return res.json({ success: true, eventId: id, ...patch });
  } catch (err: any) {
    logger.error('Erro ao desativar evento', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao desativar' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/events/:id/activate — ativa E publica
// ---------------------------------------------------------------------------
router.post('/api/admin/events/:id/activate', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!requireAdmin(authUser)) return res.status(403).json({ error: 'Apenas admin' });
  const id = req.params.id as string;
  if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return res.status(400).json({ error: 'ID de evento inválido' });
  }
  try {
    const db = getDb();
    const ref = db.collection('events').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Evento não encontrado' });
    const current = snap.data() as any;
    const now = new Date().toISOString();
    const patch: Record<string, any> = {
      isBlocked: false,
      status: 'active',
      scheduledBlockDate: null,
      // Publica: sem isto o convite continua invisível (isEventActive exige isPublished).
      isPublished: true,
      updatedAt: now,
    };
    if (!current?.publishedAt) patch.publishedAt = now;
    await ref.update(patch);
    logger.success(`Evento ativado+publicado pelo admin ${id}`, { category: 'SYSTEM' });
    await logAudit({ actorEmail: authUser?.email || 'admin', action: 'event.activate', targetType: 'event', targetId: id });
    return res.json({ success: true, eventId: id, ...patch });
  } catch (err: any) {
    logger.error('Erro ao ativar evento', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao ativar' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/events/:id/delete — apaga evento + subcoleções (admin).
// Exige { confirm: true } no body (dupla confirmação além do confirm() da UI).
// ---------------------------------------------------------------------------
const EVENT_SUBCOLLECTIONS = ['guests', 'contributions', 'photos', 'messages', 'team', 'tables'];

/** Apaga os comprovantes do evento no Storage (best-effort, via Admin SDK). */
async function deleteEventReceipts(eventId: string): Promise<number> {
  try {
    const bucket = getStorageBucket();
    const [files] = await bucket.getFiles({ prefix: `receipts/${eventId}/` });
    await Promise.all(files.map((f) => f.delete().catch(() => undefined)));
    return files.length;
  } catch {
    return 0;
  }
}

router.post('/api/admin/events/:id/delete', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!requireAdmin(authUser)) return res.status(403).json({ error: 'Apenas admin' });
  const id = req.params.id as string;
  if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return res.status(400).json({ error: 'ID de evento inválido' });
  }
  if ((req.body || {}).confirm !== true) {
    return res.status(400).json({ error: 'Confirmação obrigatória (confirm: true)' });
  }
  try {
    const db = getDb();
    const ref = db.collection('events').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Evento não encontrado' });
    const title = (snap.data() as any)?.title || id;
    // Subcoleções independentes: 6 deleções numa onda (era waterfall de 6 RTT).
    // Mesmas eliminações, mesmos batches de 400 — só o paralelismo muda.
    const deletedPerSub = await Promise.all(
      EVENT_SUBCOLLECTIONS.map(async (sub) => {
        const qsnap = await ref.collection(sub).get();
        // Batch em blocos de 400 (limite 500 por batch).
        for (let i = 0; i < qsnap.docs.length; i += 400) {
          const batch = db.batch();
          qsnap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
        return qsnap.size;
      })
    );
    let deletedDocs = deletedPerSub.reduce((a, n) => a + n, 0);
    await ref.delete();
    const deletedReceipts = await deleteEventReceipts(id);
    logger.warn(`Evento apagado pelo admin ${id} (+${deletedDocs} docs, +${deletedReceipts} comprovantes)`, { category: 'SYSTEM' });
    await logAudit({
      actorEmail: authUser?.email || 'admin',
      action: 'event.delete',
      targetType: 'event',
      targetId: id,
      detail: `"${String(title).slice(0, 100)}" +${deletedDocs} docs`,
    });
    return res.json({ success: true, eventId: id, deletedDocs });
  } catch (err: any) {
    logger.error('Erro ao apagar evento', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao apagar' });
  }
});

// POST /api/admin/receipts/cleanup — limpeza única de comprovantes órfãos.
// Comprovantes de eventos já apagados ficam no bucket (antes do delete com
// limpeza). Sem { confirm: true } faz dry-run (só conta, não apaga).
// Cap de 5000 ficheiros por corrida (truncated: true pede nova corrida).
// ---------------------------------------------------------------------------
router.post('/api/admin/receipts/cleanup', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!requireAdmin(authUser)) return res.status(403).json({ error: 'Apenas admin' });
  const dryRun = (req.body || {}).confirm !== true;
  try {
    const db = getDb();
    const bucket = getStorageBucket();
    const [files, , apiResp] = await bucket.getFiles({ prefix: 'receipts/', maxResults: 5000 });
    const truncated = !!(apiResp as any)?.nextPageToken;
    // Agrupar por evento: receipts/{eventId}/{guestId}.{ext}
    const byEvent = new Map<string, { files: number; bytes: number }>();
    for (const f of files) {
      const m = /^receipts\/([^/]+)\//.exec(f.name);
      if (!m) continue;
      const g = byEvent.get(m[1]) || { files: 0, bytes: 0 };
      g.files += 1;
      g.bytes += Number(f.metadata?.size || 0);
      byEvent.set(m[1], g);
    }
    // Existência dos eventos (getAll em blocos de 100).
    const ids = [...byEvent.keys()];
    const existing = new Set<string>();
    for (let i = 0; i < ids.length; i += 100) {
      const refs = ids.slice(i, i + 100).map((eid) => db.collection('events').doc(eid));
      const snaps = await db.getAll(...refs);
      snaps.forEach((s: any, k: number) => {
        if (s.exists) existing.add(ids[i + k]);
      });
    }
    const orphans = ids
      .filter((eid) => !existing.has(eid))
      .map((eid) => ({ eventId: eid, ...byEvent.get(eid)! }));
    const orphanFiles = orphans.reduce((a, o) => a + o.files, 0);
    const orphanBytes = orphans.reduce((a, o) => a + o.bytes, 0);
    let deletedFiles = 0;
    if (!dryRun && orphans.length > 0) {
      const targets: string[] = [];
      const [all] = await bucket.getFiles({ prefix: 'receipts/', maxResults: 5000 });
      for (const f of all) {
        const m = /^receipts\/([^/]+)\//.exec(f.name);
        if (m && !existing.has(m[1])) targets.push(f.name);
      }
      await Promise.all(targets.map((n) => bucket.file(n).delete().catch(() => undefined)));
      // Recontar o que realmente saiu.
      const [left] = await bucket.getFiles({ prefix: 'receipts/', maxResults: 5000 });
      const leftSet = new Set(left.map((f) => f.name));
      deletedFiles = targets.filter((n) => !leftSet.has(n)).length;
      logger.warn(`Limpeza de comprovantes órfãos pelo admin: ${deletedFiles} ficheiros`, { category: 'SYSTEM' });
      await logAudit({
        actorEmail: authUser?.email || 'admin',
        action: 'receipts.cleanup',
        targetType: 'system',
        targetId: 'receipts/',
        detail: `${deletedFiles} ficheiros órfãos apagados (${orphans.length} eventos)`,
      });
    }
    return res.json({
      success: true,
      dryRun,
      truncated,
      checkedFiles: files.length,
      orphanEvents: orphans.length,
      orphanFiles,
      orphanBytes,
      deletedFiles,
      orphans: orphans.slice(0, 100),
    });
  } catch (err: any) {
    logger.error('Erro na limpeza de comprovantes órfãos', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Falha na limpeza.' });
  }
});

export default router;
