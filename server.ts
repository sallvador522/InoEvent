/**
 * InoEvents Server — Main Orchestrator
 * 
 * This file is the thin entry point that:
 * 1. Loads env config and validates critical variables
 * 2. Configures Express middleware (security, compression, CORS)
 * 3. Mounts route modules from server/routes/
 * 4. Starts the server (local) or exports for Vercel
 * 
 * All route logic lives in dedicated modules under server/routes/.
 * Database helpers live in server/lib/firebase-admin.ts.
 */
import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from './lib/logger.js';

// --- Initialize Firebase Admin (side-effect: calls admin.initializeApp) ---
import './server/lib/firebase-admin.js';

// --- Route Modules ---
import rsvpRoutes from './server/routes/rsvp.js';
import geoRoutes from './server/routes/geo.js';
import seoRoutes from './server/routes/seo.js';
import ordersRoutes from './server/routes/orders.js';
import subscriptionsRoutes from './server/routes/subscriptions.js';

// --- Express App ---
const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(compression());

// Static asset serving
app.use('/assets', express.static(path.join(process.cwd(), 'dist/assets')));
app.use(express.static(path.join(process.cwd(), 'dist')));
app.use(express.static(path.join(process.cwd(), 'public')));

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
      mediaSrc: ["'self'", "https:", "http:", "data:", "blob:"],
      frameSrc: ["'self'", "https://maps.googleapis.com", "https://www.google.com", "https://www.youtube.com"],
      frameAncestors: ["'self'", "https://*.google.com", "https://*.googleusercontent.com", "https://*.run.app"],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  frameguard: false
}));

app.set('trust proxy', true);

// Redirect unauthorized domains to the primary production domain
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

// CORS
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
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

// JSON body parser with raw body capture for webhook signature verification
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  }
}));

// --- Health Check & Static Files ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/sitemap.xml', (_req, res) => {
  res.header('Content-Type', 'application/xml');
  res.sendFile(path.join(process.cwd(), 'public/sitemap.xml'));
});

app.get('/robots.txt', (_req, res) => {
  res.header('Content-Type', 'text/plain');
  res.sendFile(path.join(process.cwd(), 'public/robots.txt'));
});

// --- Mount Route Modules ---
app.use(geoRoutes);       // /api/geo/search — proxy keyless de zonas (antes do SEO)
app.use(seoRoutes);      // SEO routes BEFORE API (they intercept /plans and /invite/:id)
app.use(rsvpRoutes);      // /api/events/:id/guests, /api/events/:id/rsvp, /api/events/:id/rsvp-status
app.use(ordersRoutes);    // /api/orders, /api/events/:id/order, /api/events/:id/upgrade, /api/events/:id/renew, /api/webhooks/payment
app.use(subscriptionsRoutes); // /api/subscriptions/*

// --- Global Error Handler ---
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
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

// --- Server Startup ---
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
    app.use((_req, res) => {
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
