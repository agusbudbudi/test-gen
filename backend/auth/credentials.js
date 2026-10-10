import crypto from 'node:crypto';

// Single-user credential check for v1.
//
// This is intentionally isolated behind `verifyCredentials()` so a future
// multi-user version can swap the implementation (e.g. look up a Mongo
// `users` collection with bcrypt-hashed passwords) without touching the
// route handlers or session logic in index.js. See auth/README.md.

const APP_PASSWORD = process.env.APP_PASSWORD;
const SINGLE_USER_ID = 'owner';

function timingSafeStringEqual(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  // Hash to a fixed length first so unequal-length inputs don't short-circuit
  // (and don't leak length via timingSafeEqual's length check).
  const aHash = crypto.createHash('sha256').update(aBuf).digest();
  const bHash = crypto.createHash('sha256').update(bBuf).digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

/**
 * @param {{ username?: string, password: string }} creds
 * @returns {Promise<string | null>} the user id ("sub") on success, else null
 */
export async function verifyCredentials({ password }) {
  if (!APP_PASSWORD) {
    throw new Error('Server missing APP_PASSWORD. Set it in .env.');
  }
  if (!password || !timingSafeStringEqual(password, APP_PASSWORD)) return null;
  return SINGLE_USER_ID;
}
