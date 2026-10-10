import { Router } from 'express';
import { verifyCredentials } from './credentials.js';
import { createSessionToken, verifySessionToken } from './session.js';

const COOKIE_NAME = 'testgen_session';
const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

// Simple in-memory limiter for failed logins, per client IP. On serverless
// it is per instance, which still slows brute-forcing considerably.
const MAX_FAILED_LOGINS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const failedLogins = new Map(); // ip -> { count, resetAt }

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (typeof forwarded === 'string' && forwarded.split(',')[0].trim()) || req.ip || 'unknown';
}

function isLockedOut(ip) {
  const entry = failedLogins.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    failedLogins.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILED_LOGINS;
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const entry = failedLogins.get(ip);
  if (!entry || now > entry.resetAt) {
    failedLogins.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count++;
  }
}

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const ip = clientIp(req);
  if (isLockedOut(ip)) {
    return res.status(429).json({ error: 'Too many failed attempts. Try again in a few minutes.' });
  }
  try {
    const { password } = req.body || {};
    const sub = await verifyCredentials({ password });
    if (!sub) {
      recordFailedLogin(ip);
      return res.status(401).json({ error: 'Invalid password' });
    }
    failedLogins.delete(ip);
    const token = createSessionToken(sub);
    res.cookie(COOKIE_NAME, token, cookieOptions);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

function readSession(req) {
  try {
    return verifySessionToken(req.cookies?.[COOKIE_NAME]);
  } catch {
    return null; // e.g. SESSION_SECRET missing in production
  }
}

authRouter.get('/me', (req, res) => {
  const session = readSession(req);
  if (!session) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true, user: session.sub });
});

/** Protects any route mounted after it. Attaches `req.user` (currently just a user id string). */
export function requireAuth(req, res, next) {
  const session = readSession(req);
  if (!session) {
    // Lets the client tell a lapsed session apart from upstream 401s (bad
    // Jira/OpenAI credentials) that the proxy routes pass straight through.
    res.set('X-Session-Required', '1');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.user = session.sub;
  next();
}
