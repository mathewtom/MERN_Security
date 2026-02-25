import express from 'express';
import cors from 'cors';

const PORT = process.env.SERVER_PORT || 5000;

const app = express();

//--Middleware-----

app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));

// Health Check
app.get('/api/health', (_req, res) => (
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    })
));

//Start Server
app.listen(PORT, () => {
    console.log(`server running on port ${PORT} [${process.env.NODE_ENV}]`);
});
