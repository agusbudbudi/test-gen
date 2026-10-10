# Auth

Single-password gate for v1 (one user). Session = signed, stateless cookie
(`session.js`), credential check = one function (`credentials.js`), route
wiring = `routes.js`. This split is what makes the multi-user migration below
a swap of one file rather than a rewrite.

## v1 (current)

- `APP_PASSWORD` (env) — the one shared password.
- `SESSION_SECRET` (env) — HMAC key for signing session cookies. Set it to a
  long random value in every environment; if unset, a random one is generated
  at process start (sessions get invalidated on every restart — fine for
  local dev, not for a real deployment).
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- `requireAuth` middleware protects the AI/Jira/Confluence/dashboard/links/
  qa-tasks routes. The static frontend build and the `/api/dashboard/webhook`
  (called by CI, not a browser) intentionally stay outside `requireAuth`.
- Sessions are fully stateless (no DB read on every request) — deliberately,
  so login never depends on MongoDB being reachable. The trade-off: "logout"
  only clears the browser's cookie, the token itself stays valid until its
  7-day expiry if it were ever resent manually. If a cookie is ever suspected
  to have leaked, rotate `SESSION_SECRET` — every outstanding token fails
  signature verification immediately, everywhere, with no database involved.
  (An earlier version of this tried DB-backed epoch invalidation for a
  "real" logout; reverted because it made the core login path fail whenever
  Mongo was unreachable, which is worse than the trade-off it fixed.)

## Migrating to multi-user later

1. Add a `users` collection (mongoose model, alongside the existing `Run`/
   `Cache` models in `api/dashboard/models/`) with `{ username, passwordHash }`
   — hash with bcrypt, never store plaintext.
2. Rewrite `verifyCredentials()` in `credentials.js` to look up that
   collection instead of comparing against `APP_PASSWORD`. Its signature
   already takes `{ username, password }` and returns a user id — no caller
   changes needed.
3. `createSessionToken(sub)` already takes an arbitrary `sub` — pass the real
   user's `_id` instead of the hardcoded `'owner'` string. `requireAuth`
   already exposes it as `req.user`.
4. Add a username field to `LoginPage.tsx` (currently password-only).
5. If any data should be scoped per-user (history, saved test cases, etc.),
   filter those queries by `req.user` — nothing in the auth layer forces
   that, it's a per-feature decision.
6. If per-user logout (rather than "rotate the secret to kill everyone's
   session") becomes worth the added DB dependency on the login path, add a
   `tokenEpoch` field to the user document and embed it in the token
   payload, checked in `verifySessionToken`. Not done in v1 — see the note
   above about why it was tried and reverted for the single-user case.
