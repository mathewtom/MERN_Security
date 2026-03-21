import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import securityHeaders from './middleware/securityHeaders.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/db.js';
import cookieParser from 'cookie-parser';
import { requestLogger, logger } from './middleware/requestLogger.js';
import { globalLimiter, authLimiter } from './middleware/rateLimiter.js';
import mongoSanitize from './middleware/sanitize.js';
import { csrfSetToken, csrfProtect } from './middleware/csrf.js';
import * as cspController from './controllers/cspController.js';
import * as paymentController from './controllers/paymentController.js';
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import authenticate from './middleware/authenticate.js';
import authorize from './middleware/authorize.js';
import AppError from './utils/AppError.js';


const app = express();

// Stripe webhook — raw body required before json parser
app.post('/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    paymentController.handleWebhook
);

app.use(requestLogger);
app.use(securityHeaders);
app.use(globalLimiter);
app.use(cors({
    origin: config.clientUrl,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    credentials: true,
    maxAge: 600,
    }));
app.use(express.json({limit: '10kb'}));
app.use(cookieParser());
app.use(mongoSanitize);

// CSP violation reports — exempt from CSRF
app.post('/api/csp-report',
    express.json({ type: 'application/csp-report' }),
    cspController.receiveReport
);

app.get('/api/csrf-token', csrfSetToken);
app.use(csrfProtect);


// Routes

app.get('/api/health', async (_req, res) => {
    const mongoose = await import('mongoose');
    const dbState = mongoose.default.connection.readyState;

    const dbStatus = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    }[dbState] || 'unknown';

    res.json({
        status: dbStatus,
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.get('/api/csp-reports', authenticate, authorize('admin'), cspController.listReports);


// Production SPA serving with nonce injection
if (config.nodeEnv === 'production') {
    const clientDistPath = path.resolve(import.meta.dirname, '../../client/dist');

    if (fs.existsSync(clientDistPath)) {
        app.use(express.static(clientDistPath, { index: false }));

        const indexHtml = fs.readFileSync(
            path.join(clientDistPath, 'index.html'),
            'utf-8'
        );

        app.get('*', (req, res) => {
            const nonce = res.locals.cspNonce;
            let html = indexHtml;
            html = html.replace(/<script(?![^>]*nonce)/g, `<script nonce="${nonce}"`);
            html = html.replaceAll('%%GTM_CONTAINER_ID%%', config.gtmContainerId || '');
            html = html.replaceAll('%%CSP_NONCE%%', nonce);
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        });
    }
}

app.all('*', (req,res,next) => {
    next(new AppError(`Cannot find ${req.method} ${req.originalUrl}`,404));
});
app.use(errorHandler);

async function Bootstrap() {
    await connectDatabase();
    app.listen(config.port, () => {
        console.log(`Server Running on port ${config.port}`);
        console.log(`Environment: ${config.nodeEnv}`);
        console.log(`Wellness Check: http://localhost:${config.port}/api/health`);
    });
};

Bootstrap().catch((error) => {
    console.error('Server failed to start');
    process.exit(1);
});
