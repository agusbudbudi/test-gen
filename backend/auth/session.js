import crypto from 'node:crypto';

// Signed, stateless session tokens (HMAC-SHA256), no DB/session store needed.
//
// Payload always carries `sub` (subject/user id) instead of a boolean flag,
// so a future multi-user version only has to change *who* `sub` refers to
// (e.g. a real Mongo user _id) rather than the token format or verification
// logic. See auth/README.md for the planned multi-user migration.
//
// Being stateless means logout can only clear the browser's cookie — the
// token itself stays cryptographically valid until it expires, even if
// resent manually after logout. That's an acceptable trade-off for a
// personal, single-password gate. If a cookie is ever suspected to have
// leaked, rotate SESSION_SECRET (and restart the server): every previously
// issued token fails signature verification immediately, everywhere, with
// no database involved.

const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const isProd = process.env.NODE_ENV === 'production';

if (!SESSION_SECRET && !isProd) {
  console.warn(
    '[auth] SESSION_SECRET is not set. Falling back to an ephemeral secret ' +
    '(sessions will be invalidated on every server restart). Set SESSION_SECRET ' +
    'in your environment before deploying.'
  );
}

// Ephemeral fallback so local/dev usage doesn't hard-crash without a .env entry.
// Never used in production: serverless instances would each get a different
// secret and reject each other's sessions at random.
const secret = SESSION_SECRET || (isProd ? null : crypto.randomBytes(32).toString('hex'));

function sign(value) {
  if (!secret) {
    throw new Error('Server missing SESSION_SECRET. Set it in the environment.');
  }
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function createSessionToken(sub) {
  const payload = { sub, exp: Date.now() + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = sign(body);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload; // { sub, exp }
  } catch {
    return null;
  }
}
