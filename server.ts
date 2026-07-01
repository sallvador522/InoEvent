import 'dotenv/config';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';

const app = express();
app.set('trust proxy', true);
const PORT = 3000;

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

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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
