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
import { getDb, admin } from '../lib/firebase-admin.js';
import { apiRateLimiter } from '../middleware/index.js';
import { logger } from '../../lib/logger.js';

const router = Router();
const ADMIN_EMAIL = 'antoniosalvador522@gmail.com';

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

function requireAdmin(authUser: { email?: string } | null): boolean {
  return !!authUser && authUser.email === ADMIN_EMAIL;
}

// ---------------------------------------------------------------------------
// POST /api/admin/events/:id/block
// ---------------------------------------------------------------------------
router.post('/api/admin/events/:id/block', apiRateLimiter, async (req, res) => {
  const authUser = await getAuthUser(req);
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
  const authUser = await getAuthUser(req);
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
    return res.json({ success: true, eventId: id, ...patch });
  } catch (err: any) {
    logger.error('Erro ao ativar evento', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao ativar' });
  }
});

export default router;
