import express from 'express';
import cors from 'cors';
import configureHelmet from './middleware/securityHeaders.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/db.js';
import cookieParser from 'cookie-parser';
import { requestLogger, logger } from './middleware/requestLogger.js';
import { globalLimiter, authLimiter } from './middleware/rateLimiter.js';
import mongoSanitize from './middleware/sanitize.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import userRoutes from './routes/userRoutes.js';
import AppError from './utils/AppError.js';


const app = express();
app.use(requestLogger);
app.use(configureHelmet());
app.use(globalLimiter);
app.use(cors({
    origin: config.clientUrl,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    credentials: true,
    maxAge: 600,
    }));
app.use(express.json({limit: '10kb'}));
app.use(cookieParser());
app.use(mongoSanitize);


//Routes

app.get('/api/health', async (_req, res) => {

    const mongoose = await import('mongoose');
    const dbState = mongoose.default.connection.readyState;
    //0 (Disconnected), 1 (Connected), 2 (Connecting), 3 (Disconnecting)

    //Creating dbStatus that is Human Readable
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

app.all('*', (req,res,next) => {
    next(new AppError(`Cannot find ${req.method} ${req.originalUrl}`,404));
});
app.use(errorHandler);

async function Bootstrap() {
    await connectDatabase(); //Connect to MongoDB
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
