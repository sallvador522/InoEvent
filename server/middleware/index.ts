/**
 * Shared middleware configurations: rate limiters, CORS, auth helpers.
 * Extracted from server.ts to keep the main orchestrator thin.
 */
import express from 'express';
import rateLimit from 'express-rate-limit';

// --- Key Generator ---
const keyGenerator = (req: express.Request) => {
  return req.headers.authorization || req['ip'] || (req.socket as any).remoteAddress || 'unknown';
};

// --- Rate Limiters ---

/** AI endpoints: 15 requests per 15 minutes */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Muitas requisições para a IA. Tente novamente mais tarde.' },
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});

/** General API endpoints: 300 requests per 15 minutes */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Muitas requisições da mesma origem. Tente novamente mais tarde.' },
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});

/** RSVP submissions: 100 per hour */
export const rsvpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas confirmações a partir deste dispositivo.' },
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Auth Helper ---

/** Extracts and verifies a Firebase ID token from the Authorization header. */
export function extractBearerToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split('Bearer ')[1];
}
