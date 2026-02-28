
import mongoose from 'mongoose';
import { config } from './env.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

export async function connectDatabase(){
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await mongoose.connect(config.mongoUri, {
                //Placeholder for non-default connection options
            });
            console.log(`MongoDB connected successfully ${attempt}/${MAX_RETRIES}`);
            return;
        } catch (error) {
            console.error(
                `MongoDB connection attempt ${attempt}/${MAX_RETRIES}`, error.message
            );
            if (attempt === MAX_RETRIES) {
                throw new Error(
                    `Failed to connect after ${MAX_RETRIES} attempts. Last error: ${error.message}`
                );
            }
        }
        console.log(`Retry in ${RETRY_DELAY_MS/1000} seconds`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
}

//Mongoose Connection Event Listeners

mongoose.connection.on('connected',() => {
    console.log('Mongoose: Connected');
});

mongoose.connection.on('disconnected',() => {
    console.warn('Mongoose: Disconnected');
});

mongoose.connection.on('error', (error) => {
    console.error('Mongoose Error:', error.message);
});

//Database Graceful Shutdown

async function gracefulShutdown(signal){
    console.log(`\n${signal} received - closing MongoDB connection`);
    try{
        await mongoose.connection.close();
        console.log('MongoDB connection shutdown gracefully');
    } catch (error) {
        console.error('MongoDB DID NOT shutdown correctly', error.message);
    }
    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
