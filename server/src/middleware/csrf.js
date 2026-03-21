// CSRF Protection — Signed Double-Submit Cookie Pattern

import crypto from 'crypto';
import { config } from '../config/env.js';
import AppError from '../utils/AppError.js';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

function generateToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const signature = crypto
        .createHmac('sha256', config.csrfSecret)
        .update(token)
        .digest('hex');
    return `${token}.${signature}`;
}

function verifyToken(signedToken) {
    const parts = signedToken.split('.');
    if (parts.length !== 2) return false;

    const [token, signature] = parts;

    const expectedSignature = crypto
        .createHmac('sha256', config.csrfSecret)
        .update(token)
        .digest('hex');

    if (signature.length !== expectedSignature.length) return false;

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// Sets a non-httpOnly CSRF cookie the client can read and echo back
export function csrfSetToken(req, res) {
    const token = generateToken();

    res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ status: 'success', message: 'CSRF token set' });
}

// Validates CSRF token on state-changing requests (POST, PATCH, DELETE)
export function csrfProtect(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const cookieToken = req.cookies[CSRF_COOKIE];
    const headerToken = req.headers[CSRF_HEADER];

    if (!cookieToken || !headerToken) {
        return next(new AppError('CSRF token missing', 403));
    }

    if (cookieToken !== headerToken) {
        return next(new AppError('CSRF token mismatch', 403));
    }

    if (!verifyToken(cookieToken)) {
        return next(new AppError('CSRF token invalid', 403));
    }

    next();
}
