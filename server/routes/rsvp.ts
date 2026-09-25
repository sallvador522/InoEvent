/**
 * RSVP & Guest Routes — Guest management and RSVP submissions.
 * 
 * Routes:
 *   GET  /api/events/:id/guests      — List guests (token-authenticated)
 *   POST /api/events/:id/rsvp        — Submit RSVP
 *   GET  /api/events/:id/rsvp-status — Check RSVP status by phone
 */
import { Router } from 'express';
import { getDb, admin, getEventDetails, readLocalGuests, writeLocalGuest, fetchFirestoreGuestsWebSDK } from '../lib/firebase-admin.js';
import { apiRateLimiter, rsvpRateLimiter } from '../middleware/index.js';
import { logger } from '../../lib/logger.js';
import { normalizePlanId, getGuestLimit, getPlanConfig } from '../../config/plans.js';
import { isEventExpired, canUseFeature } from '../lib/entitlements.js';
import { getActiveSubscription } from '../lib/billing.js';

const router = Router();

async function getAuthUser(req: any): Promise<{ uid: string; email?: string } | null> {
  const hdr = req.headers.authorization as string | undefined;
  if (!hdr || !hdr.startsWith('Bearer ')) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(hdr.slice(7));
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

// --- List Guests ---
router.get('/api/events/:id/guests', apiRateLimiter, async (req, res) => {
    const id = req.params.id as string;
    const { token } = req.query;
    try {
        const event = await getEventDetails(id);
        if (!event) {
            return res.status(404).json({ error: 'Not found' });
        }
        
        // Robust token validation: compare trimmed uppercase tokens if event.clientToken exists
        const eventToken = (event.clientToken || '').toString().trim().toUpperCase();
        const reqToken = (String(token || '')).trim().toUpperCase();
        // Lista de convidados (nomes + telefones): exige código do evento OU
        // login de dono/equipa/admin. Sem prova → 403 (privacidade).
        // Via código (receção/cliente): exige ainda a funcionalidade 'checkin'
        // (VIP/Business) — o token sozinho não abre a lista de planos sem ela.
        let authorized = !!eventToken && eventToken === reqToken;
        let viaTokenOnly = authorized;
        if (!authorized) {
            const authUser = await getAuthUser(req);
            if (authUser) {
                const db = getDb();
                const isAdmin = authUser.email === 'antoniosalvador522@gmail.com';
                const isOwner = (event as any).ownerId === authUser.uid;
                let isTeam = false;
                if (!isOwner && !isAdmin) {
                    try {
                        const t = await db.collection('events').doc(id).collection('team').doc(authUser.uid).get();
                        isTeam = t.exists;
                    } catch { /* nega por omissão */ }
                }
                authorized = isOwner || isTeam || isAdmin;
            }
        }
        if (!authorized) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        if (viaTokenOnly) {
            if (!canUseFeature(normalizePlanId((event as any).planId || (event as any).plan), 'checkin')) {
                return res.status(403).json({
                    error: 'Este evento não inclui check-in. Faça upgrade para VIP.',
                    code: 'CHECKIN_NOT_INCLUDED',
                });
            }
        }
        // Subscrição viva (Business): sem subscrição ativa, o ilimitado fecha.
        // Cobre cancelados e expirados — a data (com 7 dias de graça no cancel)
        // é a única fonte; eventos herdados sem sub nunca passam aqui.
        if (normalizePlanId((event as any).planId || (event as any).plan) === 'business') {
            const ownerId = (event as any).ownerId as string | undefined;
            const sub = ownerId ? await getActiveSubscription(ownerId).catch(() => null) : null;
            if (!sub) {
                return res.status(403).json({
                    error: 'Assinatura Business inativa. Fale connosco para renovar.',
                    code: 'SUBSCRIPTION_INACTIVE',
                    plan: 'business',
                });
            }
        }
        
        let guests: any[] = [];
        try {
            const db = getDb();
            const guestsSnap = await db.collection('events').doc(id).collection('guests').get();
            guests = guestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (dbErr: any) {
            // Fallback to Client Web SDK on Node.js if Firebase Admin SDK lacks service account credentials
            guests = await fetchFirestoreGuestsWebSDK(id);
        }
        
        // Merge with local fallback guests if any exist (prevents data loss when guests RSVP via local fallback)
        const localGuests = readLocalGuests(id);
        if (localGuests.length > 0) {
            const existingIds = new Set(guests.map(g => g.id));
            const existingPhones = new Set(guests.map(g => ((g as any).phone || '').toString().trim().replace(/[\s\-()]/g, "")));
            for (const lg of localGuests) {
                const normP = (lg.phone || '').toString().trim().replace(/[\s\-()]/g, "");
                if (!existingIds.has(lg.id) && (!normP || !existingPhones.has(normP))) {
                    guests.push(lg);
                }
            }
        }
        
        return res.json({ guests });
    } catch (err) {
        logger.error(`Erro ao buscar convidados para o evento ${id}:`, { category: 'DATABASE', data: err });
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Submit RSVP ---
router.post('/api/events/:id/rsvp', rsvpRateLimiter, async (req, res) => {
    const id = req.params.id as string;
    const { phone, guestData } = req.body;
    logger.info(`RSVP route hit para evento ${id}`, { category: 'DATABASE', data: { phone, body: req.body } });
    try {
        const event = await getEventDetails(id);
        if (!event) return res.status(404).json({ error: 'Not found' });
        
        // §6, §7, §8 — validação centralizada (não hardcode).
        // Omissão = 'free' (identidade do registo): sem plano carimbado, sem quota.
        const planId = normalizePlanId((event as any).planId || (event as any).plan || 'free');
        const planConfig = getPlanConfig(planId);
        const limit = getGuestLimit(planId);
        // Expiração server-side (§8) — não confiar só no frontend
        if (isEventExpired(event as any)) {
            return res.status(403).json({ 
                error: 'Este convite expirou. Contacte o organizador para renovar.',
                code: 'EVENT_EXPIRED',
                plan: planId,
                expiresAt: (event as any).expiresAt || null
            });
        }
        // Bloqueio manual
        if ((event as any).isBlocked) {
            return res.status(403).json({ error: (event as any).blockedMessage || 'Convite temporariamente indisponível.', code: 'EVENT_BLOCKED' });
        }
        // Ativação (§8/conta): rascunhos não recebem RSVP. Vale conta ativa
        // (com validade viva) OU publicado (legado). Coerente com o ecrã, que
        // mostra estes eventos como bloqueados (isAccountActive).
        const accExp = (event as any).accountExpiresAt;
        const accountValid = (event as any).accountActive === true && (!accExp || new Date(accExp) > new Date());
        const activated = accountValid || (event as any).isPublished === true;
        if (!activated) {
            return res.status(403).json({
                error: 'Este convite ainda não foi ativado. Contacte o organizador.',
                code: 'EVENT_NOT_ACTIVATED',
                plan: planId
            });
        }
        // Subscrição viva (Business): sem subscrição ativa, o ilimitado fecha
        // (cobre cancelados e expirados; a graça de 7 dias vive na data).
        if (planId === 'business') {
            const ownerId = (event as any).ownerId as string | undefined;
            const sub = ownerId ? await getActiveSubscription(ownerId).catch(() => null) : null;
            if (!sub) {
                return res.status(403).json({
                    error: 'Assinatura Business inativa. Fale connosco para renovar.',
                    code: 'SUBSCRIPTION_INACTIVE',
                    plan: planId,
                });
            }
        }
        
        try {
            const db = getDb();
            const eventRef = db.collection('events').doc(id);
            const guestsRef = eventRef.collection('guests');
            
            // Count guests — §7 limite centralizado.
            // Quota = todos os registos EXCETO recusados (DECLINED liberta o lugar).
            // Mesma semântica do ecrã (filtro status !== 'DECLINED').
            const [totalSnap, declinedSnap] = await Promise.all([
                guestsRef.count().get(),
                guestsRef.where('status', '==', 'DECLINED').count().get(),
            ]);
            const current = totalSnap.data().count - declinedSnap.data().count;
            if (current >= limit) {
                const msg = limit === Infinity ? 'Limite atingido.' : `Atingiu o limite de ${limit} convidados do plano ${planConfig.name}. Faça upgrade para continuar.`;
                return res.status(400).json({ 
                    error: msg,
                    code: 'GUEST_LIMIT_REACHED',
                    plan: planId,
                    limit,
                    current,
                    upgradeTo: planId === 'essential' ? 'premium' : planId === 'premium' ? 'vip' : 'business'
                });
            }
            
            // Check duplicate
            if (phone) {
                const normalizedPhone = phone.trim().replace(/[\s\-()]/g, "");
                const phoneQuery = await guestsRef.where('phone', '==', normalizedPhone).get();
                const phoneQueryRaw = await guestsRef.where('phone', '==', phone.trim()).get();
                if (!phoneQuery.empty || !phoneQueryRaw.empty) {
                    return res.status(400).json({ error: 'Este número de WhatsApp já confirmou presença neste evento.' });
                }
            }
            
            const newGuestRef = guestsRef.doc();
            await newGuestRef.set({
                ...guestData,
                createdAt: new Date().toISOString()
            });
            
            return res.json({ success: true, guestId: newGuestRef.id });
        } catch (dbErr: any) {
            const isPermissionError = dbErr.message?.includes('PERMISSION_DENIED') || dbErr.message?.includes('Missing or insufficient permissions');
            if (isPermissionError || process.env.NODE_ENV !== 'production') {
                logger.warn(`Utilizando fallback de banco de dados local para registrar RSVP no evento ${id} devido a: ${dbErr.message}`);
                
                const localGuests = readLocalGuests(id);
                const localCurrent = localGuests.filter((g: any) => g.status !== 'DECLINED').length;
                if (localCurrent >= limit) {
                    const msg = limit === Infinity ? 'Limite atingido.' : `Atingiu o limite de ${limit} convidados do plano ${planConfig.name}. Faça upgrade para continuar.`;
                    return res.status(400).json({ 
                        error: msg,
                        code: 'GUEST_LIMIT_REACHED',
                        plan: planId,
                        limit,
                        current: localCurrent
                    });
                }
                
                if (phone) {
                    const normalizedPhone = phone.trim().replace(/[\s\-()]/g, "");
                    const duplicate = localGuests.find((g: any) => {
                        const gp = (g.phone || '').trim().replace(/[\s\-()]/g, "");
                        return gp === normalizedPhone || (g.phone && g.phone.trim() === phone.trim());
                    });
                    if (duplicate) {
                        return res.status(400).json({ error: 'Este número de WhatsApp já confirmou presença neste evento.' });
                    }
                }
                
                const mockId = 'guest_' + Math.random().toString(36).substr(2, 9);
                const newGuest = {
                    id: mockId,
                    ...guestData,
                    createdAt: new Date().toISOString()
                };
                writeLocalGuest(id, newGuest);
                
                return res.json({ success: true, guestId: mockId });
            }
            throw dbErr;
        }
    } catch (err: any) {
        logger.error(`Exceção no servidor ao processar RSVP para o evento ${id}`, { category: 'DATABASE', data: err?.stack || err });
        logger.error(`Erro ao processar RSVP no evento ${id}:`, { category: 'DATABASE', data: err?.message || err });
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Check RSVP Status ---
router.get('/api/events/:id/rsvp-status', apiRateLimiter, async (req, res) => {
    const id = req.params.id as string;
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Missing phone' });
    try {
        try {
            const db = getDb();
            const guestsRef = db.collection('events').doc(id).collection('guests');
            const normalizedPhone = (phone as string).trim().replace(/[\s\-()]/g, "");
            const snap = await guestsRef.where('phone', '==', normalizedPhone).get();
            
            if (snap.empty) {
                return res.status(404).json({ error: 'Nenhuma confirmação encontrada para este número.' });
            }
            const guestDoc = snap.docs[0];
            const guestData = { id: guestDoc.id, ...guestDoc.data() } as any;
            
            if (guestData.tableId) {
                const tableSnap = await db.collection('events').doc(id).collection('tables').doc(guestData.tableId).get();
                if (tableSnap.exists) {
                    guestData.tableName = tableSnap.data()?.name;
                }
            }
            
            return res.json({ guest: guestData });
        } catch (dbErr: any) {
            const isPermissionError = dbErr.message?.includes('PERMISSION_DENIED') || dbErr.message?.includes('Missing or insufficient permissions');
            if (isPermissionError || process.env.NODE_ENV !== 'production') {
                logger.warn(`Utilizando fallback de banco de dados local para rsvp-status no evento ${id} devido a: ${dbErr.message}`);
                
                const localGuests = readLocalGuests(id);
                const normalizedPhone = (phone as string).trim().replace(/[\s\-()]/g, "");
                const guestData = localGuests.find((g: any) => {
                    const gp = (g.phone || '').trim().replace(/[\s\-()]/g, "");
                    return gp === normalizedPhone || (g.phone && g.phone.trim() === (phone as string).trim());
                });
                
                if (!guestData) {
                    return res.status(404).json({ error: 'Nenhuma confirmação encontrada para este número.' });
                }
                
                return res.json({ guest: guestData });
            }
            throw dbErr;
        }
    } catch (err) {
        logger.error(`Erro ao consultar status do rsvp para o evento ${id}:`, { category: 'DATABASE', data: err });
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
