/**
 * Events Routes — criação de eventos com enforcement server-side (§7).
 *
 * POST /api/events — cria evento (novo). Impõe o limite de criação por plano
 * (getEventCreationLimit) no servidor: o cheque client-side existe nos 4 fluxos
 * de criação mas é contornável; aqui é obrigatório (exceto rascunhos, showers
 * e Business, mesma semântica do cliente). Campos privilegiados (plan,
 * billingStatus, isPublished, isBlocked, account*) são carimbados pelo
 * servidor e NUNCA aceites do cliente.
 */
import { Router } from 'express';
import { getDb, admin } from '../lib/firebase-admin.js';
import { apiRateLimiter } from '../middleware/index.js';
import {
  normalizePlanId,
  getEventCreationLimit,
  calculateExpiresAt,
  isBusinessPlan,
} from '../../config/plans.js';
import { logger } from '../../lib/logger.js';
import { getActiveSubscription } from '../lib/billing.js';

const router = Router();

const SHOWER_TYPES = ['BRIDAL_SHOWER', 'BABY_SHOWER'];
const UPGRADE_AFTER: Record<string, string | null> = {
  free: 'essential',
  essential: 'premium',
  premium: 'vip',
  vip: 'business',
  business: null,
};

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

function randomId(prefix: string): string {
  return `${prefix}_` + Math.random().toString(36).slice(2, 11);
}

// ---------------------------------------------------------------------------
// POST /api/events — cria evento com limite por plano
// body: { id?: string, payload?: object, draft?: boolean }
// ---------------------------------------------------------------------------
router.post('/api/events', apiRateLimiter, async (req, res) => {
  const authUser = await getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Autenticação obrigatória' });

  const { id, payload, draft } = req.body as any;
  const data = payload && typeof payload === 'object' ? payload : {};
  const eventId = typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id) ? id : randomId('evt');
  const type = typeof data.type === 'string' ? data.type : 'WEDDING';

  try {
    const db = getDb();
    const isAdmin = authUser.email === 'antoniosalvador522@gmail.com';
    const ownerId =
      isAdmin && typeof data.ownerId === 'string' && data.ownerId ? data.ownerId : authUser.uid;

    // Plano da conta (fonte: ficha do utilizador, não o que o cliente enviou)
    let userPlan = 'free';
    try {
      const userSnap = await db.collection('users').doc(ownerId).get();
      userPlan = normalizePlanId(userSnap.exists ? (userSnap.data() as any)?.plan : 'free');
    } catch {
      userPlan = 'free';
    }

    // Limite de criação (§7): showers, Business COM subscrição viva e rascunhos
    // passam sempre. Business sem subscrição ativa é recusado (fail-closed).
    const isShower = SHOWER_TYPES.includes(type);
    if (isBusinessPlan(userPlan)) {
      const sub = await getActiveSubscription(ownerId).catch(() => null);
      if (!sub) {
        return res.status(403).json({
          error: 'Assinatura Business inativa. Fale connosco para renovar e voltar a criar eventos.',
          code: 'SUBSCRIPTION_INACTIVE',
          plan: userPlan,
        });
      }
    }
    if (!draft && !isShower && !isBusinessPlan(userPlan)) {
      const limit = getEventCreationLimit(userPlan);
      const snap = await db.collection('events').where('ownerId', '==', ownerId).get();
      const current = snap.docs.filter((d) => !SHOWER_TYPES.includes((d.data() as any)?.type)).length;
      if (current >= limit) {
        return res.status(403).json({
          error: `Você atingiu o limite de ${limit} eventos do seu plano. Faça upgrade para criar mais!`,
          code: 'EVENT_LIMIT_REACHED',
          plan: userPlan,
          limit,
          current,
          upgradeTo: UPGRADE_AFTER[userPlan] ?? 'business',
        });
      }
    }

    const ref = db.collection('events').doc(eventId);
    if ((await ref.get()).exists) {
      return res.status(409).json({ error: 'Evento já existe. Edite em vez de criar.' });
    }

    // Sanitiza: remove tudo o que só o servidor/ativação pode definir.
    // whiteLabel*: carimbado da ficha do dono (cliente não forja marca).
    const {
      plan: _plan,
      planId: _planId,
      billingStatus: _billing,
      isPublished: _pub,
      isBlocked: _blocked,
      accountActive: _aa,
      accountExpiresAt: _aae,
      orderId: _order,
      ownerId: _owner,
      id: _id,
      createdAt: _created,
      updatedAt: _updated,
      expiresAt: _exp,
      whiteLabelName: _wln,
      whiteLabelLogo: _wll,
      ...clientFields
    } = data;

    const now = new Date();
    const expiresAt = calculateExpiresAt(userPlan, now);
    // Marca da agência: carimbada da ficha do dono (só faz sentido em business).
    let whiteLabelName: string | null = null;
    let whiteLabelLogo: string | null = null;
    try {
      const ownerSnap = await db.collection('users').doc(ownerId).get();
      const od = ownerSnap.exists ? (ownerSnap.data() as any) : {};
      whiteLabelName = typeof od?.whiteLabelName === 'string' ? od.whiteLabelName : null;
      whiteLabelLogo = typeof od?.whiteLabelLogo === 'string' ? od.whiteLabelLogo : null;
    } catch { /* sem marca — segue o jogo */ }
    await ref.set({
      ...clientFields,
      id: eventId,
      ownerId,
      plan: userPlan,
      planId: userPlan,
      billingStatus: 'pending',
      isPublished: false,
      isBlocked: false,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      whiteLabelName,
      whiteLabelLogo,
      clientToken:
        typeof (data as any).clientToken === 'string' && (data as any).clientToken
          ? (data as any).clientToken
          : Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    logger.success(`Evento criado via API user=${ownerId} event=${eventId} plan=${userPlan}`, {
      category: 'SYSTEM',
    });
    return res.json({ id: eventId });
  } catch (err: any) {
    logger.error(`Erro ao criar evento via API:`, { category: 'DATABASE', data: err?.message || err });
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
