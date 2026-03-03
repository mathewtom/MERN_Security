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

### Cookie Hardening
- **`httpOnly: true`** — Refresh token cookie inaccessible to JavaScript (XSS mitigation) — [`authController.js`](server/src/controllers/authController.js)
- **`secure: true` in production** — Cookie only sent over HTTPS — [`authController.js`](server/src/controllers/authController.js)
- **`sameSite: 'strict'`** — Prevents cross-site request forgery — [`authController.js`](server/src/controllers/authController.js)
- **`path: '/api/auth'`** — Cookie scoped to auth endpoints only — [`authController.js`](server/src/controllers/authController.js)

### Input Validation & Mass Assignment Prevention
- **Schema-level validation** — Email regex, field length limits, trimming, and case normalization at the Mongoose layer — [`User.js`](server/src/models/User.js)
- **Field whitelist for updates** — Only explicitly allowed fields (`firstName`, `lastName`) can be modified; prevents role/email/password tampering — [`userService.js`](server/src/services/userService.js)
- **Request body size limit** — `express.json({ limit: '10kb' })` to prevent large payload attacks — [`index.js`](server/src/index.js)

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
