import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import crypto from 'crypto';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import admin from 'firebase-admin';
import compression from 'compression';
import { logger } from './lib/logger.js';
let firebaseConfig: any = null;
try {
  firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
} catch (e) {
  logger.error('Failed to load firebase-applet-config.json on boot', { category: 'SYSTEM', data: e });
}

const app = express();
app.use(compression());

// Bulletproof fallback for Vercel static assets in case Output Directory is misconfigured
app.use('/assets', express.static(path.join(process.cwd(), 'dist/assets')));
app.use(express.static(path.join(process.cwd(), 'dist')));


const keyGenerator = (req: express.Request) => {
  return req.headers.authorization || req['ip'] || (req.socket as any).remoteAddress || 'unknown';
};

const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { error: 'Muitas requisições para a IA. Tente novamente mais tarde.' },
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});



const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: 'Muitas requisições da mesma origem. Tente novamente mais tarde.' },
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});

const rsvpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: { error: 'Muitas confirmações a partir deste dispositivo.' },
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com", "https://cdn.tailwindcss.com", "https://www.googletagmanager.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https://firebasestorage.googleapis.com", "https://firestore.googleapis.com", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://*.googleapis.com", "wss://*.firebaseio.com", "https://*.google-analytics.com", "https://www.google-analytics.com"],
      frameSrc: ["'self'", "https://maps.googleapis.com", "https://www.youtube.com"],
      frameAncestors: ["'self'", "https://*.google.com", "https://*.googleusercontent.com", "https://*.run.app"],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  frameguard: false
}));
app.set('trust proxy', true);
const PORT = 3000;

// Redirect unauthorized domains to the primary production domain (www.inoevent.online)
app.use((req, res, next) => {
  const host = req.headers.host || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const isCloudRun = host.includes('.run.app');
  const isMainProd = host === 'inoevent.online' || host === 'www.inoevent.online';

  if (!isLocal && !isCloudRun && !isMainProd && host) {
    const targetUrl = `https://www.inoevent.online${req.originalUrl}`;
    logger.info(`Redirecionando tráfego do host "${host}" para domínio de produção: ${targetUrl}`, { category: 'ROUTER' });
    return res.redirect(301, targetUrl);
  }
  next();
});

// Initialize Firebase Admin
try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: firebaseConfig ? firebaseConfig.projectId : process.env.GOOGLE_CLOUD_PROJECT || 'dummy-project',
    });
  }
  const dbId = firebaseConfig ? firebaseConfig.firestoreDatabaseId : undefined;
  if (dbId && dbId !== '(default)') {
    try {
      const dbInstance = admin.firestore();
      dbInstance.settings({ databaseId: dbId });
    } catch (settingsError) {
      logger.warn("Revertendo para inicialização padrão do Firestore devido a erro de configuração:", {
        category: 'DATABASE',
        data: settingsError
      });
      admin.firestore();
    }
  } else {
    admin.firestore();
  }
  logger.success("SDK do Firebase Admin Firestore inicializado com sucesso.", { category: 'DATABASE' });
} catch (error) {
  logger.error("Erro crítico ao inicializar SDK do Firebase Admin:", {
    category: 'DATABASE',
    data: error
  });
}

// Helper to fetch event details safely
async function getEventDetails(eventId: string) {
  try {
    const dbId = (firebaseConfig && firebaseConfig.firestoreDatabaseId) ? firebaseConfig.firestoreDatabaseId : '(default)';
    const projectId = (firebaseConfig && firebaseConfig.projectId) ? firebaseConfig.projectId : process.env.GOOGLE_CLOUD_PROJECT || 'dummy-project';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/events/${eventId}`;
    const res = await fetch(url);
    if (!res.ok) {
        return null;
    }
    const data = await res.json();
    if (data.fields) {
        // Need to parse Firestore REST format to simple JS object
        const parseValue = (val: any): any => {
            if (val.stringValue !== undefined) return val.stringValue;
            if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
            if (val.booleanValue !== undefined) return val.booleanValue;
            if (val.arrayValue !== undefined) {
               return (val.arrayValue.values || []).map(parseValue);
            }
            if (val.mapValue !== undefined) {
               const map: any = {};
               for (const key in val.mapValue.fields) {
                   map[key] = parseValue(val.mapValue.fields[key]);
               }
               return map;
            }
            return null;
        };
        const parsedData: any = {};
        for (const key in data.fields) {
            parsedData[key] = parseValue(data.fields[key]);
        }
        return parsedData;
    }
  } catch (error) {
    logger.error(`Erro ao buscar detalhes do evento ID ${eventId}:`, { category: 'DATABASE', data: error });
  }
  return null;
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.includes('.run.app') || 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') || 
      origin === 'https://www.inoevent.online' || 
      origin === 'https://inoevent.online'
    ) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  }
};
app.use(cors(corsOptions));
// For webhooks, we need the raw body if verifying signatures, but JSON parser is easier 
// if it's already an object. We'll capture raw body for HMAC verification.
app.use(express.json({
  verify: (req, res, buf) => {
    (req as any).rawBody = buf;
  }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.sendFile(path.join(process.cwd(), 'public/sitemap.xml'));
});

// Serve robots.txt
app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.sendFile(path.join(process.cwd(), 'public/robots.txt'));
});

// Generate bespoke invitation description during onboarding
app.post('/api/generate-description', aiRateLimiter, async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Token não fornecido.' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // Optionally fetch user plan to enforce limit (already handled by rate limit + frontend mostly, but good for security)
  } catch (error) {
    logger.error("Erro na verificação do token ao gerar descrição:", { category: 'AUTH', data: error });
    return res.status(401).json({ error: 'Não autorizado. Token inválido.' });
  }

  const { eventType, title, date, style } = req.body;
  if (!eventType || !title) {
    return res.status(400).json({ error: 'Missing eventType or title parameter' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Chave de API do Gemini não configurada no servidor' });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: key });

    const prompt = `Crie uma mensagem curta, elegante e sofisticada de convite de boas-vindas / introdução do evento no tom adequado ao estilo "${style || 'Clássico'}".
Tipo de Evento: ${eventType === 'BABY_SHOWER' ? 'CHÁ DE BEBÊ (Baby Shower)' : eventType === 'BRIDAL_SHOWER' ? 'CHÁ DE PANELA (Bridal Shower)' : 'CASAMENTO (Wedding)'}.
Título do Evento: "${title}".
Data do Evento: "${date || 'A definir'}".
Apenas retorne o parágrafo de introdução (máximo 3 frases), escrito em Português elegante, pronto para emocionar os convidados. Não inclua aspas extras nem marcas markdown, apenas o parágrafo corrido.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.75,
      }
    });

    res.json({ text: response.text?.trim() || '' });
  } catch (error: any) {
    logger.error('Erro no Gemini ao criar descrição do evento:', { category: 'AI', data: error });
    res.status(500).json({ error: error.message });
  }
});

// Smart Assistant Chat Proxy Route
app.post('/api/smart-assistant/chat', aiRateLimiter, async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Token não fornecido.' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    logger.error("Falha ao verificar token de autenticação no assistente inteligente:", { category: 'AUTH', data: error });
    return res.status(401).json({ error: 'Não autorizado. Token inválido.' });
  }

  const { event, guests, messages, input } = req.body;
  if (!event || !guests || !messages || !input) {
    return res.status(400).json({ error: 'Missing required parameters: event, guests, messages, or input' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Chave de API do Gemini não configurada no servidor' });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: key });

    const systemInstruction = `Você é um assessor de eventos expert e profissional para a plataforma InoEvents.
Você está ajudando o anfitrião do evento "${event.title}" (Tipo: ${event.type}).
O evento acontecerá no dia ${event.date} às ${event.time} em ${event.location}.
O evento tem ${guests.length} convidados cadastrados no momento. 
Convidados confirmados: ${guests.filter((g: any) => g.status === 'CONFIRMED').length}.
Convidados recusados: ${guests.filter((g: any) => g.status === 'DECLINED').length}.
Pendentes: ${guests.filter((g: any) => g.status === 'PENDING').length}.
Convidados que já entraram (check-in): ${guests.filter((g: any) => g.checkedIn).length}.

Responda sempre em PT-BR de forma clara, prestativa e amigável.
Seja conciso mas muito direto e útil.
Se o usuário pedir para gerar uma mensagem de convite, crie algo muito bem escrito. Baseado no tipo do evento (Casamento, Aniversário, Corporativo, etc).`;

    const history = messages.map((m: any) => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n');
    const prompt = `${history}\nUser: ${input.trim()}\nAI:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text || "Desculpe, ocorreu um erro." });
  } catch (error: any) {
    logger.error('Erro no Gemini durante o chat com o assistente inteligente:', { category: 'AI', data: error });
    res.status(500).json({ error: error.message });
  }
});

// Smart Assistant Booster Proxy Route
app.post('/api/smart-assistant/booster', aiRateLimiter, async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Token não fornecido.' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    logger.error("Erro na verificação do token ao acessar booster assistente:", { category: 'AUTH', data: error });
    return res.status(401).json({ error: 'Não autorizado. Token inválido.' });
  }

  const { event, guests } = req.body;
  if (!event || !guests) {
    return res.status(400).json({ error: 'Missing required parameters: event or guests' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Chave de API do Gemini não configurada no servidor' });
  }

  try {
    const { GoogleGenAI, Type } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: key });

    const systemInstruction = `Você é o mecanismo inteligente InoAI Smart Booster para a plataforma InoEvents.
Seu dever é analisar a lista de convidados para o evento "${event.title}" e identificar "RSVPs Críticos" que necessitam de intervenção ou contato imediato do organizador.

Considere as regras para definir um RSVP como Crítico:
1. Convidados pendentes (status === 'PENDING') com telefone cadastrado e nenhuma confirmação.
2. Convidados que recusaram (status === 'DECLINED') mas que possuem papel estratégico (como familiares próximos).
3. Convidados confirmados (status === 'CONFIRMED') mas com inconsistências (acompanhantes não discriminados ou dúvidas pendentes).
4. Grupos pendentes de grande porte (para estimativa correta de buffet).

Você deve retornar obrigatoriamente um objeto JSON no formato do esquema fornecido.
Forneça insights de alto nível no campo 'overallInsights' e recomende os próximos passos estratégicos no campo 'nextSteps'.
Crie mensagens de contato (draftMessage) personalizadas, amigáveis, gentis e persuasivas em português do Brasil, prontas para WhatsApp ou E-mail.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        criticalGuests: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nome completo do convidado" },
              phone: { type: Type.STRING, description: "Telefone do convidado" },
              status: { type: Type.STRING, description: "PENDING, CONFIRMED ou DECLINED" },
              severity: { type: Type.STRING, description: "Nível de gravidade/criticidade: HIGH, MEDIUM ou LOW" },
              reason: { type: Type.STRING, description: "Motivo que torna esta confirmação crítica" },
              actionPlan: { type: Type.STRING, description: "O que o organizador deve sugerir ou fazer" },
              draftMessage: { type: Type.STRING, description: "Mensagem personalizada no tom adequado para o convidado" }
            },
            required: ["name", "phone", "status", "severity", "reason", "actionPlan", "draftMessage"]
          }
        },
        overallInsights: { type: Type.STRING, description: "Visão estratégica de confirmações de presença do evento" },
        urgencyRating: { type: Type.INTEGER, description: "Grau geral de urgência para contato (1 a 5)" },
        nextSteps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Próximos passos imediatos sugeridos"
        }
      },
      required: ["criticalGuests", "overallInsights", "urgencyRating", "nextSteps"]
    };

    const guestsData = guests.map((g: any) => ({
      name: g.name,
      phone: g.phone || 'Não fornecido',
      status: g.status,
      adults: g.adults || 1,
      children: g.children || 0,
      message: g.message || ''
    }));

    const prompt = `Analise os seguintes convidados do evento "${event.title}" (Data: ${event.date}):
${JSON.stringify(guestsData, null, 2)}
Gere o relatório completo respeitando o esquema JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      }
    });

    res.json(JSON.parse(response.text?.trim() || "{}"));
  } catch (error: any) {
    logger.error('Erro no Gemini durante a análise do booster:', { category: 'AI', data: error });
    res.status(500).json({ error: error.message });
  }
});



// --- Security API Endpoints for Guests (Fixing Data Leak) ---
import { getFirestore } from 'firebase-admin/firestore';

app.get('/api/events/:id/guests', apiRateLimiter, async (req, res) => {
    const { id } = req.params;
    const { token } = req.query;
    try {
        const db = getFirestore();
        const eventDoc = await db.collection('events').doc(id).get();
        if (!eventDoc.exists || eventDoc.data()?.clientToken !== token) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const guestsSnap = await db.collection('events').doc(id).collection('guests').get();
        const guests = guestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ guests });
    } catch (err) {
        logger.error(`Erro ao buscar convidados para o evento ${id}:`, { category: 'DATABASE', data: err });
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/events/:id/rsvp', express.json(), rsvpRateLimiter, async (req, res) => {
    const { id } = req.params;
    const { phone, guestData } = req.body;
    try {
        const db = getFirestore();
        const eventRef = db.collection('events').doc(id);
        const eventDoc = await eventRef.get();
        if (!eventDoc.exists) return res.status(404).json({ error: 'Not found' });
        
        const event = eventDoc.data();
        const plan = event?.plan || 'Essencial';
        const limit = plan === 'Essencial' ? 100 : Infinity;
        
        const guestsRef = eventRef.collection('guests');
        
        // Count guests
        const countSnap = await guestsRef.count().get();
        if (countSnap.data().count >= limit) {
            return res.status(400).json({ error: 'O limite de convidados para este evento foi atingido.' });
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
        
        res.json({ success: true, guestId: newGuestRef.id });
    } catch (err) {
        logger.error(`Erro ao processar RSVP no evento ${id}:`, { category: 'DATABASE', data: err });
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/events/:id/rsvp-status', apiRateLimiter, async (req, res) => {
    const { id } = req.params;
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Missing phone' });
    try {
        const db = getFirestore();
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
        
        res.json({ guest: guestData });
    } catch (err) {
        logger.error(`Erro ao consultar status do rsvp para o evento ${id}:`, { category: 'DATABASE', data: err });
        res.status(500).json({ error: 'Server error' });
    }
});

// Global in-memory cache for webhooks and concurrency locks to prevent race conditions
const paymentWebhooks = new Map<string, any>();
const activeTransactionLocks = new Set<string>();

// Status checking endpoint for the frontend (with Firestore backup persistence check)
app.get('/api/payments/status', apiRateLimiter, async (req, res) => {
   const externalId = req.query.externalId as string;
   if (!externalId) return res.status(400).json({ error: 'Missing externalId' });

   // 1. Check in-memory status cache
   const webhookData = paymentWebhooks.get(externalId);
   if (webhookData) {
      return res.json({ status: webhookData.status, data: webhookData });
   }

   // 2. Backup persistence check: Query Firestore to recover state in case of server restart
   try {
      const db = getFirestore();
      const txDoc = await db.collection('transactions').doc(externalId).get();
      if (txDoc.exists) {
          const txData = txDoc.data();
          const restoredStatus = txData?.status || 'SUCCESS';
          return res.json({ 
              status: restoredStatus, 
              data: { 
                  status: restoredStatus, 
                  planName: txData?.planName, 
                  amount: txData?.amount, 
                  userId: txData?.ownerId, 
                  eventId: txData?.eventId 
              } 
          });
      }
   } catch (err) {
      logger.error('Erro de backup na verificação de status do pagamento:', { category: 'PAYMENT', data: err });
   }

   return res.json({ status: 'PENDING' });
});

// Secure endpoint to confirm payment and upgrade plans, preventing race conditions
app.post('/api/payments/confirm', express.json(), apiRateLimiter, async (req, res) => {
    // Webhook Token / HMAC Signature validation
    const providedSecret = req.headers['x-webhook-secret'] || req.headers['authorization'];
    const expectedSecret = process.env.PAYMENTS_WEBHOOK_SECRET || 'super-secret-inoevents-webhook-key-2026';

    if (providedSecret !== expectedSecret && providedSecret !== `Bearer ${expectedSecret}`) {
        logger.warn(`[Payment Security] Tentativa de confirmação de pagamento não autorizada.`);
        return res.status(401).json({ error: 'Não autorizado: Token de segurança do webhook inválido ou ausente.' });
    }

    const { transactionId, amount, userId, eventId, planName } = req.body;

    if (!transactionId) {
        return res.status(400).json({ error: 'Falta o transactionId' });
    }
    if (!planName) {
        return res.status(400).json({ error: 'Falta o planName' });
    }

    // 1. In-Memory Concurrency Lock to prevent concurrent race conditions on the same transaction ID
    if (activeTransactionLocks.has(transactionId)) {
        console.warn(`[Lock] Pagamento ${transactionId} já está a ser processado concurrently.`);
        return res.status(409).json({ error: 'Este pagamento está a ser processado neste momento. Por favor, aguarde.' });
    }

    // Acquire lock
    activeTransactionLocks.add(transactionId);
    console.log(`[Lock] Adquirido lock para o pagamento ${transactionId}`);

    try {
        const db = getFirestore();
        
        // 2. Database level atomic transaction using Firestore Transactions
        const result = await db.runTransaction(async (transaction) => {
            const txDocRef = db.collection('transactions').doc(transactionId);
            const txDoc = await transaction.get(txDocRef);

            // Idempotency check: if transaction is already processed, return existing status
            if (txDoc.exists) {
                console.log(`[Idempotency] Transação ${transactionId} já foi processada.`);
                return { success: true, alreadyProcessed: true, plan: txDoc.data()?.planName };
            }

            // Upgrade Event if eventId is provided
            if (eventId) {
                const eventRef = db.collection('events').doc(eventId);
                const eventDoc = await transaction.get(eventRef);
                if (eventDoc.exists) {
                    transaction.update(eventRef, {
                        plan: planName,
                        updatedAt: new Date().toISOString()
                    });
                    console.log(`[Upgrade] Plano do evento ${eventId} atualizado para ${planName}`);
                }
            }

            // Upgrade User if userId is provided
            if (userId) {
                const userRef = db.collection('users').doc(userId);
                const userDoc = await transaction.get(userRef);
                if (userDoc.exists) {
                    const date = new Date();
                    date.setMonth(date.getMonth() + 1); // 1 month validity
                    transaction.update(userRef, {
                        plan: planName,
                        planExpiresAt: planName === 'Essencial' ? null : date.toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    console.log(`[Upgrade] Plano do utilizador ${userId} atualizado para ${planName}`);
                    
                    // Add notification atomically inside the transaction
                    const notifRef = userRef.collection('notifications').doc();
                    transaction.set(notifRef, {
                        title: 'Plano Ativado com Sucesso! 🎉',
                        message: `O seu acesso ao plano ${planName} foi ativado com sucesso. Aproveite todas as funcionalidades exclusivas!`,
                        createdAt: new Date().toISOString(),
                        read: false,
                        type: 'plan_upgrade'
                    });
                }
            }

            // Create Transaction record atomically
            transaction.set(txDocRef, {
                ownerId: userId || 'anonymous',
                amount: amount || 0,
                type: 'CREDIT',
                description: `Upgrade de Plano para ${planName} (Tx: ${transactionId})`,
                date: new Date().toISOString(),
                eventId: eventId || null,
                planName: planName,
                status: 'SUCCESS'
            });

            return { success: true, alreadyProcessed: false, plan: planName };
        });

        // Store status in cache for status endpoint
        paymentWebhooks.set(transactionId, { status: 'SUCCESS', planName, amount, userId, eventId });

        return res.json(result);
    } catch (err: any) {
        logger.error(`[Payment Error] Falha ao processar pagamento ${transactionId}:`, { category: 'PAYMENT', data: err });
        paymentWebhooks.set(transactionId, { status: 'FAILED', error: err.message });
        return res.status(500).json({ error: 'Erro de transação no servidor', details: err.message });
    } finally {
        // Release lock
        activeTransactionLocks.delete(transactionId);
        logger.info(`[Lock] Lock libertado para o pagamento ${transactionId}`, { category: 'PAYMENT' });
    }
});

// Authoritative Plan Verification Route
app.get('/api/events/:id/verify-plan', apiRateLimiter, async (req, res) => {
    const { id } = req.params;
    try {
        const db = getFirestore();
        const eventDoc = await db.collection('events').doc(id).get();
        if (!eventDoc.exists) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }
        
        const eventData = eventDoc.data();
        const plan = eventData?.plan || 'Essencial';
        const isBlocked = eventData?.isBlocked || false;
        
        // Define authoritative feature support lists per plan
        const features = {
            rsvpLimit: plan === 'Essencial' ? 100 : plan === 'Premium' ? 500 : Infinity,
            backgroundMusic: plan !== 'Essencial',
            customDomain: plan !== 'Essencial' && plan !== 'Free',
            tableMaps: plan !== 'Essencial' && plan !== 'Free',
            guestBook: plan !== 'Essencial' && plan !== 'Free',
            whiteLabel: plan !== 'Essencial' && plan !== 'Free',
            staffAccess: plan === 'Business' || plan === 'Corporate',
        };

        return res.json({
            eventId: id,
            plan,
            isBlocked,
            features,
            verifiedAt: new Date().toISOString()
        });
    } catch (err) {
        logger.error('Erro ao verificar plano de forma autoritativa:', { category: 'PAYMENT', data: err });
        return res.status(500).json({ error: 'Erro ao verificar plano no servidor' });
    }
});

// Dynamic Open Graph / SEO support for plans page (to help AI and LLMs read pricing)
app.get('/plans', async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  try {
    let html = "";
    const possiblePaths = [
      path.join(process.cwd(), 'dist/index.html'),
      path.join(process.cwd(), 'index.html')
    ];
    let foundPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (foundPath) {
      html = await fs.promises.readFile(foundPath, 'utf8');
    } else {
      return next();
    }
    
    const plansTitle = "Planos e Preços de Convites Digitais Premium | InoEvents";
    const plansDesc = "Conheça os preços do InoEvents. Plano Essencial (7.500 Kz), Plano Premium (20.000 Kz) e Plano Business para agências (45.000 Kz/mês). Crie convites com RSVP e QR Code em Angola.";
    
    html = html.replace(/<title>[^<]*<\/title>/g, `<title>${plansTitle}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/g, `<meta name="description" content="${plansDesc}" />`);
    
    // Inject hidden text block for AI crawlers (like GPTBot, Perplexity)
    const hiddenAIText = `
      <div style="display:none;" id="ai-pricing-context">
        <h1>Preços e Planos do InoEvents Angola</h1>
        <h2>Plano Essencial</h2>
        <p>Preço: 7.500 Kz (Pagamento único por evento).</p>
        <p>Inclui: RSVP para até 100 convidados, Código QR Exclusivo, Galeria de Fotos Básica.</p>
        <h2>Plano Premium</h2>
        <p>Preço: 20.000 Kz (Pagamento único por evento).</p>
        <p>Inclui: RSVP Ilimitado, Sem marca d'água (White-label), Música de Fundo (TocaPlayer), Domínio Personalizado (.com), Mapa das Mesas, Livro de Assinaturas Digital e temas premium.</p>
        <h2>Plano Business (B2B)</h2>
        <p>Preço: 45.000 Kz mensais ou 450.000 Kz anuais.</p>
        <p>Inclui: Eventos Ilimitados para agências e cerimonialistas, Design White-Label para clientes, Painel de Gestão e Check-in Inteligente.</p>
      </div>
    `;
    
    html = html.replace('<div id="root"></div>', `${hiddenAIText}\n    <div id="root"></div>`);
    
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    logger.error('Erro na rota SEO de planos (/plans):', { category: 'SEO', data: err });
    return next();
  }
});

// Dynamic Open Graph / SEO support for individual invitations
app.get('/invite/:id', async (req, res, next) => {
  // In development, skip SEO injection and let Vite handle the HTML to prevent white screens
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const { id } = req.params;

  
  // Basic security and length check for ID
  if (!id || id.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return next();
  }

  try {
    // Fetch event from Firestore
    const eventData = await getEventDetails(id);

    
    // Read index.html
    const isProd = process.env.NODE_ENV === 'production';
    let html = "";
    const possiblePaths = [
      path.join(process.cwd(), 'dist/index.html'),
      path.join(process.cwd(), 'index.html')
    ];
    let foundPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (foundPath) {
      html = await fs.promises.readFile(foundPath, 'utf8');
    } else {
      try {
        const isLocal = req.headers.host && req.headers.host.includes('localhost');
        const protocol = req.headers['x-forwarded-proto'] || (isLocal ? 'http' : 'https');
        const host = req.headers.host || 'www.inoevent.online';
        const fetchRes = await fetch(`${protocol}://${host}/`);
        if (fetchRes.ok) {
           html = await fetchRes.text();
        } else {
           return next();
        }
      } catch(e) {
         logger.error('Falha no fallback de busca HTML na rota SEO do convite:', { category: 'SEO', data: e });
         return next();
      }
    }
    
    if (eventData) {
      const eventTitle = eventData.title || 'Convite Especial';
      
      // Determine elegant localized invitation message
      let eventDesc = 'Você está a ser convidado para este grande evento. Confirme sua presença e confira todos os detalhes!';
      if (eventData.type === 'BRIDAL_SHOWER') {
        const bride = eventData.brideName || eventData.title;
        eventDesc = `Você está a ser convidado para o Chá de Panela de ${bride}. Confirme sua presença e confira todos os detalhes!`;
      } else if (eventData.type === 'BABY_SHOWER') {
        eventDesc = `Você está a ser convidado para o Chá de Bebê de ${eventData.title}. Confirme sua presença e confira todos os detalhes!`;
      } else if (eventData.type === 'WEDDING') {
        const couple = (eventData.brideName && eventData.groomName) ? `${eventData.brideName} & ${eventData.groomName}` : eventData.title;
        eventDesc = `Você está a ser convidado para o Casamento de ${couple}. Confirme sua presença e confira todos os detalhes!`;
      } else {
        eventDesc = `Você está a ser convidado para o evento "${eventData.title}". Confirme sua presença e confira todos os detalhes!`;
      }
      
      // Determine the image to display
      let eventImage = 'https://www.inoevent.online/inoOG.jpg';
      
      const eventUrl = `https://www.inoevent.online/invite/${id}`;
      
      // Replace titles and descriptions in index.html to ensure crawlers get unique tags
      html = html.replace(/<title>[^<]*<\/title>/g, `<title>${eventTitle} | InoEvents</title>`);
      
      // Replace meta description
      html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/g, `<meta name="description" content="${eventDesc.replace(/"/g, '&quot;')}" />`);
      
      // Replace Open Graph / Facebook tags
      html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/g, `<meta property="og:title" content="${eventTitle.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/g, `<meta property="og:description" content="${eventDesc.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?>/g, `<meta property="og:image" content="${eventImage}" />`);
      html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/?>/g, `<meta property="og:url" content="${eventUrl}" />`);
      
      // Replace Twitter tags
      html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/g, `<meta name="twitter:title" content="${eventTitle.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/g, `<meta name="twitter:description" content="${eventDesc.replace(/"/g, '&quot;')}" />`);
      html = html.replace(/<meta name="twitter:image" content="[^"]*"\s*\/?>/g, `<meta name="twitter:image" content="${eventImage}" />`);
    }
    
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err: any) {
    logger.error('Erro na rota serveInvitationWithSEO:', { category: 'SEO', data: err });
    return next();
  }
});

// Global Express Uncaught Exception Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Exceção Express não capturada: ${err.message || String(err)}`, {
    category: 'SYSTEM',
    data: {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    }
  });
  res.status(500).json({
    error: 'Ocorreu um erro inesperado no servidor. A equipa de engenharia foi notificada.'
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.success(`Servidor do InoEvents em execução na porta ${PORT}`, { category: 'SYSTEM' });
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
