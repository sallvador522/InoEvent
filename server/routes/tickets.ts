/**
 * Tickets Routes — suporte com SLA.
 *
 * POST /api/tickets                 — dono abre ticket (categoria define o SLA)
 * GET  /api/tickets/mine            — meus tickets (+ mensagens)
 * GET  /api/admin/tickets           — fila admin (vencidos primeiro)
 * POST /api/admin/tickets/:id/reply — resposta admin (+ notificação ao dono)
 * POST /api/admin/tickets/:id/status — { status: em_atendimento|resolvido }
 *
 * SLA (horas corridas, ajustável): pagamento 4h, tecnico 8h, duvida 24h.
 */
import { Router } from 'express';
import { getDb } from '../lib/firebase-admin.js';
import { apiRateLimiter } from '../middleware/index.js';
import { getAdminAuthUser, isAdmin as checkIsAdmin } from '../lib/admin-auth.js';
import { logAudit } from '../lib/audit.js';
import { logger } from '../../lib/logger.js';

const router = Router();

export const TICKET_SLA_HOURS: Record<string, number> = {
  pagamento: 4,
  tecnico: 8,
  duvida: 24,
};

export const TICKET_STATUS = ['aberto', 'em_atendimento', 'resolvido'] as const;

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------------------
// POST /api/tickets — dono abre (exige login; força userId = auth uid)
// ---------------------------------------------------------------------------
router.post('/api/tickets', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Autenticação obrigatória' });
  const { subject, message, category, eventId } = (req.body || {}) as any;
  if (!subject || typeof subject !== 'string' || !subject.trim() || subject.trim().length > 120) {
    return res.status(400).json({ error: 'Assunto obrigatório (até 120 caracteres)' });
  }
  if (!message || typeof message !== 'string' || !message.trim() || message.trim().length > 2000) {
    return res.status(400).json({ error: 'Mensagem obrigatória (até 2000 caracteres)' });
  }
  const cat = ['pagamento', 'tecnico', 'duvida'].includes(category) ? category : 'duvida';
  try {
    const db = getDb();
    const id = randomId('tkt');
    const now = new Date().toISOString();
    const slaDue = new Date(Date.now() + (TICKET_SLA_HOURS[cat] || 24) * 3600000).toISOString();
    await db.collection('tickets').doc(id).set({
      id,
      userId: authUser.uid,
      eventId: typeof eventId === 'string' ? eventId.slice(0, 128) : null,
      subject: subject.trim().slice(0, 120),
      category: cat,
      status: 'aberto',
      slaDue,
      createdAt: now,
      updatedAt: now,
    });
    await db.collection('tickets').doc(id).collection('messages').add({
      from: 'user',
      text: message.trim().slice(0, 2000),
      at: now,
    });
    return res.status(201).json({ success: true, id, slaDue });
  } catch (err: any) {
    logger.error('Erro ao abrir ticket', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao abrir ticket' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/tickets/mine — meus tickets com mensagens
// ---------------------------------------------------------------------------
router.get('/api/tickets/mine', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Autenticação obrigatória' });
  try {
    const db = getDb();
    const snap = await db.collection('tickets').where('userId', '==', authUser.uid).get();
    const list = [];
    for (const d of snap.docs) {
      const data = d.data() as any;
      const msnap = await d.ref.collection('messages').orderBy('at', 'asc').limit(100).get();
      list.push({ ...data, messages: msnap.docs.map((m) => ({ id: m.id, ...m.data() })) });
    }
    list.sort((a: any, b: any) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    return res.json({ tickets: list });
  } catch (err: any) {
    logger.error('Erro ao listar tickets', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao listar' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/tickets — fila (vencidos primeiro, depois mais recentes)
// ---------------------------------------------------------------------------
router.get('/api/admin/tickets', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!checkIsAdmin(authUser)) return res.status(403).json({ error: 'Apenas admin' });
  try {
    const db = getDb();
    const snap = await db.collection('tickets').get();
    const now = Date.now();
    const list = snap.docs.map((d) => {
      const data = d.data() as any;
      const overdue = data.status !== 'resolvido' && data.slaDue && new Date(data.slaDue).getTime() < now;
      return { ...data, overdue: !!overdue };
    });
    list.sort((a: any, b: any) => {
      if (!!a.overdue !== !!b.overdue) return a.overdue ? -1 : 1;
      if (a.status !== b.status) return a.status === 'aberto' ? -1 : 1;
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
    return res.json({ tickets: list });
  } catch (err: any) {
    logger.error('Erro na fila de tickets', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao listar' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/tickets/:id/reply — { text }
// ---------------------------------------------------------------------------
router.post('/api/admin/tickets/:id/reply', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!checkIsAdmin(authUser)) return res.status(403).json({ error: 'Apenas admin' });
  const id = req.params.id as string;
  const { text } = (req.body || {}) as any;
  if (!text || typeof text !== 'string' || !text.trim() || text.trim().length > 2000) {
    return res.status(400).json({ error: 'Resposta obrigatória (até 2000 caracteres)' });
  }
  try {
    const db = getDb();
    const ref = db.collection('tickets').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Ticket não encontrado' });
    const now = new Date().toISOString();
    await ref.collection('messages').add({ from: 'admin', by: authUser!.email || 'admin', text: text.trim().slice(0, 2000), at: now });
    const patch: Record<string, any> = { updatedAt: now };
    if ((snap.data() as any)?.status === 'aberto') patch.status = 'em_atendimento';
    await ref.update(patch);
    // Notifica o dono no painel (best-effort).
    try {
      const ownerId = (snap.data() as any)?.userId;
      if (ownerId) {
        await db.collection('users').doc(ownerId).collection('notifications').add({
          title: 'Resposta do suporte 💬',
          message: `A equipa respondeu ao teu ticket "${(snap.data() as any)?.subject || ''}". Abre o suporte para ler.`,
          createdAt: now,
          read: false,
          type: 'admin_alert',
        });
      }
    } catch { /* best-effort */ }
    await logAudit({ actorEmail: authUser!.email || 'admin', action: 'ticket.reply', targetType: 'system', targetId: id, detail: `ticket ${(snap.data() as any)?.subject || ''}`.slice(0, 200) });
    return res.json({ success: true });
  } catch (err: any) {
    logger.error('Erro ao responder ticket', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro ao responder' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/tickets/:id/status — { status }
// ---------------------------------------------------------------------------
router.post('/api/admin/tickets/:id/status', apiRateLimiter, async (req, res) => {
  const authUser = await getAdminAuthUser(req);
  if (!checkIsAdmin(authUser)) return res.status(403).json({ error: 'Apenas admin' });
  const id = req.params.id as string;
  const { status } = (req.body || {}) as any;
  if (!TICKET_STATUS.includes(status)) return res.status(400).json({ error: 'Status inválido' });
  try {
    const db = getDb();
    const ref = db.collection('tickets').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Ticket não encontrado' });
    await ref.update({ status, updatedAt: new Date().toISOString() });
    await logAudit({ actorEmail: authUser!.email || 'admin', action: 'ticket.status', targetType: 'system', targetId: id, detail: status });
    return res.json({ success: true, status });
  } catch (err: any) {
    logger.error('Erro ao mudar status do ticket', { category: 'SYSTEM', data: err?.message || err });
    return res.status(500).json({ error: 'Erro' });
  }
});

export default router;
