import 'dotenv/config';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import cors from 'cors';
import fs from 'fs';
import admin from 'firebase-admin';
import firebaseConfig from './firebase-applet-config.json';

const app = express();
app.set('trust proxy', true);
const PORT = 3000;

// Initialize Firebase Admin
try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
  const dbId = firebaseConfig.firestoreDatabaseId;
  if (dbId && dbId !== '(default)') {
    try {
      const dbInstance = admin.firestore();
      dbInstance.settings({ databaseId: dbId });
    } catch (settingsError) {
      console.warn("Falling back to standard firestore initialization:", settingsError);
      admin.firestore();
    }
  } else {
    admin.firestore();
  }
  console.log("Firebase Admin Firestore initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
}

// Helper to fetch event details safely
async function getEventDetails(eventId: string) {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/events/${eventId}`;
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
    console.error(`Error fetching event details for ID ${eventId}:`, error);
  }
  return null;
}

app.use(cors());
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
app.post('/api/generate-description', async (req, res) => {
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
    console.error('Gemini error during description creation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create payment
app.post('/api/payments/create', async (req, res) => {
  const { amount, externalId, client, items, metadata } = req.body;
  if (!amount || !externalId) {
    return res.status(400).json({ error: 'Missing amount or externalId' });
  }
  
  if (!process.env.PLINQPAY_API_KEY) {
     console.error("PLINQPAY_API_KEY is not set in environment variables!");
  }

  const payload = {
    externalId,
    callbackUrl: req.hostname === 'localhost' ? 'https://eof9eaf5r5pftid.m.pipedream.net' : `https://${req.hostname}/api/webhooks/plinqpay`,
    method: 'REFERENCE',
    client: {
      name: client?.name || 'Cliente',
      email: client?.email || 'cliente@exemplo.com',
      phone: client?.phone || '+244923000000'
    },
    items,
    amount
  };

  try {
    console.log('Sending to PlinqPay:', JSON.stringify(payload, null, 2));
    const response = await fetch('https://api.plinqpay.com/v1/transaction', {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         'api-key': process.env.PLINQPAY_API_KEY || ''
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
       console.error('PlinqPay API Error:', JSON.stringify(data, null, 2));

       // Handle specific PlinqPay unverified account error
       const messageStr = Array.isArray(data.message) ? data.message.join(', ') : (data.message || '');
       if (messageStr.includes('Verifica a sua conta') || messageStr.includes('excutar esta acção')) {
           return res.status(200).json({
               success: true,
               data: {
                   entity: '99999',
                   reference: '000000000',
                   amount: amount
               },
               _devNote: 'MOCK gerado pois a conta PlinqPay fornecida não está verificada (KYC pendente).'
           });
       }

       const errorMessage = messageStr || data.error || 'Erro no pagamento';
       return res.status(response.status).json({ error: errorMessage, details: data });
    }
    
    // Save pending transaction removed, the client will do it
    res.json(data);
  } catch (error: any) {
    console.error('Error creating PlinqPay payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// In-memory store to pass webhook data to the client polling
const paymentWebhooks = new Map<string, any>();

// Webhook for PlinqPay
app.post('/api/webhooks/plinqpay', async (req, res) => {
  const payload = req.body;
  const secretKey = process.env.PLINQPAY_SECRET_KEY || '';

  const sign = payload.signature || payload.sign;
  const payloadToVerify = {
    externalId: payload.externalId || payload.externId,
    amount: payload.amount,
    method: payload.method,
    callbackUrl: payload.callbackUrl,
  };

  const canonical = JSON.stringify(payloadToVerify);
  try {
    if (secretKey && sign) {
        const expectedSign = crypto
          .createHmac('sha256', secretKey)
          .update(canonical, 'utf8')
          .digest('base64');
        const isValid = crypto.timingSafeEqual(Buffer.from(expectedSign), Buffer.from(sign));
        if (!isValid) {
          console.error('Invalid HMAC webhook');
          return res.status(401).json({ error: 'Invalid HMAC signature' });
        }
    }
  } catch(e) {
    console.error("Error validating HMAC", e);
  }

  // Store the new status for the frontend
  const extId = payload.externalId || payload.externId;
  if (extId) {
     paymentWebhooks.set(extId, payload);
  }
  
  res.send('OK');
});

// Status checking endpoint for the frontend
app.get('/api/payments/status', async (req, res) => {
   const externalId = req.query.externalId as string;
   if (!externalId) return res.status(400).json({ error: 'Missing externalId' });

   const webhookData = paymentWebhooks.get(externalId);
   if (webhookData) {
      res.json({ status: webhookData.status, data: webhookData });
      if (webhookData.status === 'SUCCESS' || webhookData.status === 'FAILED') {
         // paymentWebhooks.delete(externalId); // Don't delete immediately so frontend can get it
      }
   } else {
      res.json({ status: 'PENDING' });
   }
});

// Dynamic Open Graph / SEO support for individual invitations
app.get('/invite/:id', async (req, res, next) => {
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
      path.join(process.cwd(), 'index.html'),
      path.join(__dirname, 'dist/index.html'),
      path.join(__dirname, 'index.html')
    ];
    let foundPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (foundPath) {
      html = fs.readFileSync(foundPath, 'utf8');
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
         console.error('Fallback fetch failed', e);
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
      let eventImage = 'https://www.inoevent.online/inoOG.png';
      if (eventData.heroImage) {
        eventImage = eventData.heroImage;
      }
      
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
  } catch (err) {
    console.error('Error in serveInvitationWithSEO route:', err);
    return next();
  }
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
    console.log(`Server is running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
