/**
 * RSVP & Guest Routes — Guest management and RSVP submissions.
 * 
 * Routes:
 *   GET  /api/events/:id/guests      — List guests (token-authenticated)
 *   POST /api/events/:id/rsvp        — Submit RSVP
 *   GET  /api/events/:id/rsvp-status — Check RSVP status by phone
 */
import { Router } from 'express';
import { getDb, getEventDetails, readLocalGuests, writeLocalGuest, fetchFirestoreGuestsWebSDK } from '../lib/firebase-admin.js';
import { apiRateLimiter, rsvpRateLimiter } from '../middleware/index.js';
import { logger } from '../../lib/logger.js';
import { normalizePlanId, getGuestLimit, getPlanConfig } from '../../config/plans.js';
import { isEventExpired } from '../lib/entitlements.js';

const router = Router();

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
        if (eventToken && eventToken !== reqToken) {
            return res.status(403).json({ error: 'Unauthorized' });
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
        
        // §6, §7, §8 — validação centralizada (não hardcode)
        const planId = normalizePlanId((event as any).planId || (event as any).plan || 'essential');
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
        
        try {
            const db = getDb();
            const eventRef = db.collection('events').doc(id);
            const guestsRef = eventRef.collection('guests');
            
            // Count guests — §7 limite centralizado
            const countSnap = await guestsRef.count().get();
            if (countSnap.data().count >= limit) {
                const msg = limit === Infinity ? 'Limite atingido.' : `Atingiu o limite de ${limit} convidados do plano ${planConfig.name}. Faça upgrade para continuar.`;
                return res.status(400).json({ 
                    error: msg,
                    code: 'GUEST_LIMIT_REACHED',
                    plan: planId,
                    limit,
                    current: countSnap.data().count,
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
                if (localGuests.length >= limit) {
                    const msg = limit === Infinity ? 'Limite atingido.' : `Atingiu o limite de ${limit} convidados do plano ${planConfig.name}. Faça upgrade para continuar.`;
                    return res.status(400).json({ 
                        error: msg,
                        code: 'GUEST_LIMIT_REACHED',
                        plan: planId,
                        limit,
                        current: localGuests.length
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
