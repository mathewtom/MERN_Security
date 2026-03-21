import crypto from 'crypto';
import helmet from 'helmet';
import { config } from '../config/env.js';

export default function securityHeaders(req, res, next) {
    const nonce = crypto.randomBytes(16).toString('base64');
    res.locals.cspNonce = nonce;

    const isDev = config.nodeEnv === 'development';

    const scriptSrc = isDev
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'",
           "https://cdnjs.cloudflare.com",
           "https://www.googletagmanager.com",
           "https://js.stripe.com"]
        : ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'",
           "https://cdnjs.cloudflare.com",
           "https://www.googletagmanager.com",
           "https://js.stripe.com"];

    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc,
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "https://www.gravatar.com", "https://www.googletagmanager.com", "https://*.stripe.com"],
                frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com", "https://www.googletagmanager.com"],
                connectSrc: ["'self'", "https://api.stripe.com", "https://www.google-analytics.com", "https://*.google-analytics.com", "https://*.analytics.google.com"],
                reportUri: "/api/csp-report",
            },
        },
        hsts: config.nodeEnv === 'production',
    })(req, res, next);
}
