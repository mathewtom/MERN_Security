# MERN Security

A full-stack MERN application built with a security-first mindset, demonstrating real-world AppSec patterns for authentication, authorization, and defensive coding practices.

## Security Demonstrations

### Authentication & Token Security
- **JWT dual-token architecture** — Short-lived access tokens (15m) + long-lived refresh tokens (7d) to limit exposure window — [`authService.js`](server/src/services/authService.js)
- **Refresh token rotation** — Old refresh token is invalidated each time a new pair is issued, preventing reuse — [`authService.js`](server/src/services/authService.js)
- **Token theft detection** — If a refresh token hash isn't found in stored tokens, all sessions are revoked, forcing re-authentication — [`authService.js`](server/src/services/authService.js)
- **Hashed token storage** — Refresh tokens are SHA-256 hashed before being stored in the database; a DB breach doesn't yield usable tokens — [`authService.js`](server/src/services/authService.js)
- **Bearer token validation middleware** — Extracts and verifies JWTs from the `Authorization` header, attaching user context to requests — [`authenticate.js`](server/src/middleware/authenticate.js)
- **Role-based access control (RBAC)** — Route-level middleware restricting access by user role — [`authorize.js`](server/src/middleware/authorize.js)

### Password Security
- **Bcrypt hashing with 12 salt rounds** — Passwords hashed via pre-save hook, only when modified — [`User.js`](server/src/models/User.js)
- **Timing-safe comparison** — `bcrypt.compare()` prevents timing attacks during login — [`User.js`](server/src/models/User.js)
- **Password excluded from queries by default** — `select: false` on the password field; must be explicitly requested — [`User.js`](server/src/models/User.js)

### CSRF Protection
- **Signed double-submit cookie pattern** — Server generates HMAC-signed CSRF tokens; client reads from cookie and echoes in `X-CSRF-Token` header — [`csrf.js`](server/src/middleware/csrf.js)
- **HMAC signature verification** — Tokens are signed with a server-side secret, preventing subdomain cookie injection attacks — [`csrf.js`](server/src/middleware/csrf.js)
- **Timing-safe token comparison** — `crypto.timingSafeEqual()` prevents timing attacks on CSRF validation — [`csrf.js`](server/src/middleware/csrf.js)
- **Automatic CSRF initialization** — Client fetches CSRF token on app startup before any state-changing requests — [`AuthContext.jsx`](client/src/context/AuthContext.jsx)

### Cookie Hardening
- **`httpOnly: true`** — Refresh token cookie inaccessible to JavaScript (XSS mitigation) — [`authController.js`](server/src/controllers/authController.js)
- **`secure: true` in production** — Cookie only sent over HTTPS — [`authController.js`](server/src/controllers/authController.js)
- **`sameSite: 'strict'`** — Prevents cross-site request forgery — [`authController.js`](server/src/controllers/authController.js)
- **`path: '/api/auth'`** — Cookie scoped to auth endpoints only — [`authController.js`](server/src/controllers/authController.js)

### Input Validation & Mass Assignment Prevention
- **Zod schema validation** — Request bodies validated and stripped of unknown fields using `.strict()` before reaching business logic — [`validate.js`](server/src/middleware/validate.js)
- **Auth endpoint schemas** — Registration enforces password complexity (uppercase, lowercase, number, special character); login schema is intentionally lenient to avoid leaking policy — [`authValidators.js`](server/src/validators/authValidators.js)
- **Profile update schema** — `.partial().strict().refine()` ensures only whitelisted fields are accepted and at least one field is present — [`userValidators.js`](server/src/validators/userValidators.js)
- **Schema-level validation** — Email regex, field length limits, trimming, and case normalization at the Mongoose layer — [`User.js`](server/src/models/User.js)
- **Field whitelist for updates** — Only explicitly allowed fields (`firstName`, `lastName`) can be modified; prevents role/email/password tampering — [`userService.js`](server/src/services/userService.js)
- **NoSQL injection sanitization** — Recursive stripping of `$` operators and dot-notation keys from `req.body`, `req.query`, and `req.params` — [`sanitize.js`](server/src/middleware/sanitize.js)
- **Request body size limit** — `express.json({ limit: '10kb' })` to prevent large payload attacks — [`index.js`](server/src/index.js)

### HTTP Security Headers & Content Security Policy
- **Dynamic per-request nonce generation** — Cryptographic nonce generated for each request, injected into CSP header and HTML script tags in production — [`securityHeaders.js`](server/src/middleware/securityHeaders.js)
- **`strict-dynamic` in production** — Nonce-trusted scripts can load child scripts without explicit allowlisting; host allowlists kept as fallback for older browsers — [`securityHeaders.js`](server/src/middleware/securityHeaders.js)
- **Multi-domain CSP with 6 directives** — CSP configured for multiple third-party integrations — [`securityHeaders.js`](server/src/middleware/securityHeaders.js)
  - `script-src`: `'self'` + `cdnjs.cloudflare.com` (day.js) + `googletagmanager.com` (GTM) + `js.stripe.com` (Stripe)
  - `style-src`: `'self'` + `'unsafe-inline'` (Stripe Elements) + `fonts.googleapis.com`
  - `font-src`: `'self'` + `fonts.gstatic.com`
  - `frame-src`: `'self'` + `js.stripe.com` (3D Secure) + `hooks.stripe.com` + `googletagmanager.com`
  - `connect-src`: `'self'` + `api.stripe.com` + `google-analytics.com`
  - `img-src`: `'self'` + `gravatar.com` + `googletagmanager.com` + `*.stripe.com`
- **CSP violation reporting** — Browsers send violation reports to `POST /api/csp-report`; stored in MongoDB with 30-day TTL auto-cleanup — [`cspController.js`](server/src/controllers/cspController.js), [`CspReport.js`](server/src/models/CspReport.js)
- **Admin CSP report viewer** — `GET /api/csp-reports` with pagination and filtering by directive or blocked URI — [`cspController.js`](server/src/controllers/cspController.js)
- **Dev vs production CSP modes** — Development uses `'unsafe-inline'`/`'unsafe-eval'` for Vite HMR compatibility; production uses nonce + `strict-dynamic` — [`securityHeaders.js`](server/src/middleware/securityHeaders.js)
- **Production SPA serving with nonce injection** — Express serves built React app, injecting per-request nonces into all `<script>` tags via template replacement — [`index.js`](server/src/index.js)
- **Google Tag Manager integration** — GTM container script with nonce support and CSP-compliant dynamic loading — [`index.html`](client/index.html)
- **HSTS in production** — HTTP Strict Transport Security header enforced only in production — [`securityHeaders.js`](server/src/middleware/securityHeaders.js)

### Stripe Payment Integration
- **PaymentIntent-based checkout** — Server creates PaymentIntents, client confirms with Stripe Elements; card data never touches the server — [`paymentService.js`](server/src/services/paymentService.js), [`UpgradeCard.jsx`](client/src/components/UpgradeCard.jsx)
- **Stripe webhook verification** — Raw body signature verification using `stripe.webhooks.constructEvent()` with dedicated webhook secret — [`paymentController.js`](server/src/controllers/paymentController.js)
- **Webhook before JSON parser** — Webhook route registered before `express.json()` to preserve raw body for signature verification — [`index.js`](server/src/index.js)
- **Plan vs role separation** — Billing tier (`plan: free/premium`) kept separate from authorization role (`role: user/admin`) — [`User.js`](server/src/models/User.js)

### Rate Limiting
- **Global rate limiter** — 100 requests per 15-minute window across all endpoints — [`rateLimiter.js`](server/src/middleware/rateLimiter.js)
- **Auth-specific rate limiter** — Tighter 20-request limit on `/api/auth`; skips successful requests to only penalize failed attempts — [`rateLimiter.js`](server/src/middleware/rateLimiter.js)
- **Standard rate limit headers** — Exposes `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers to clients — [`index.js`](server/src/index.js)

### Logging & Sensitive Data Exclusion
- **Structured logging with Pino** — JSON-formatted logs in production; human-readable in development — [`requestLogger.js`](server/src/middleware/requestLogger.js)
- **Sensitive data excluded from logs** — Request headers, body, and params intentionally omitted from log serializers to prevent credential leakage — [`requestLogger.js`](server/src/middleware/requestLogger.js)
- **Health check suppression** — `/api/health` requests excluded from logs to reduce noise — [`requestLogger.js`](server/src/middleware/requestLogger.js)

### Error Handling & Information Disclosure
- **Environment-aware error responses** — Full stack traces in development; sanitized generic messages in production — [`errorHandler.js`](server/src/middleware/errorHandler.js)
- **User enumeration prevention** — Login returns the same "Invalid email or password" message for both wrong email and wrong password — [`authService.js`](server/src/services/authService.js)
- **Mongoose error transformation** — `ValidationError`, `CastError`, duplicate key, and JWT errors are converted to safe `AppError` responses — [`errorHandler.js`](server/src/middleware/errorHandler.js)

### Configuration & Secrets
- **Schema-validated environment variables** — Required secrets enforced at startup with type checking; app won't start with missing config — [`env.js`](server/src/config/env.js)
- **Frozen config object** — `Object.freeze()` prevents runtime mutation of configuration — [`env.js`](server/src/config/env.js)

### Database Resilience
- **Connection retry logic** — 5 reconnection attempts with delay on startup failure — [`db.js`](server/src/config/db.js)
- **Graceful shutdown** — SIGINT/SIGTERM handlers close MongoDB connections before process exit — [`db.js`](server/src/config/db.js)

### Docker
- **Alpine base images** — `node:20-alpine` for minimal attack surface — [`server/Dockerfile`](server/Dockerfile), [`client/Dockerfile`](client/Dockerfile)
- **Deterministic installs** — `npm ci` with lockfile for reproducible, auditable builds — [`server/Dockerfile`](server/Dockerfile)
- **Service isolation** — Containers communicate via Docker network; only necessary ports exposed — [`docker-compose.yml`](docker-compose.yml)
