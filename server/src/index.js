import express from 'express';
import { config } from './config/env.js';
import { connectDatabase } from './config/db.js';

const app = express();

app.use(express.json());

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
