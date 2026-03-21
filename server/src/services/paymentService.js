import Stripe from 'stripe';
import { config } from '../config/env.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const stripe = config.stripeSecretKey
    ? new Stripe(config.stripeSecretKey)
    : null;

const UPGRADE_AMOUNT = 999;
const CURRENCY = 'usd';

export async function createPaymentIntent(userId) {
    if (!stripe) {
        throw new AppError('Stripe is not configured', 503);
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (user.plan === 'premium') {
        throw new AppError('Already on premium plan', 400);
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: UPGRADE_AMOUNT,
        currency: CURRENCY,
        metadata: { userId: userId.toString() },
    });

    return {
        clientSecret: paymentIntent.client_secret,
        amount: UPGRADE_AMOUNT,
        currency: CURRENCY,
    };
}

export async function handleWebhookEvent(rawBody, signature) {
    if (!stripe) {
        throw new AppError('Stripe is not configured', 503);
    }

    const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        config.stripeWebhookSecret
    );

    if (event.type === 'payment_intent.succeeded') {
        const { userId } = event.data.object.metadata;
        if (userId) {
            await User.findByIdAndUpdate(userId, {
                plan: 'premium',
                upgradedAt: new Date(),
            });
        }
    }

    return { received: true };
}

export function getPublishableKey() {
    return config.stripePublishableKey || '';
}
