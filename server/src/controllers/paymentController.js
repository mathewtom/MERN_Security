import * as paymentService from '../services/paymentService.js';
import AppError from '../utils/AppError.js';

function catchAsync(fn) {
    return (req, res, next) => fn(req, res, next).catch(next);
}

export const getConfig = (_req, res) => {
    res.json({
        status: 'success',
        data: { publishableKey: paymentService.getPublishableKey() },
    });
};

export const createIntent = catchAsync(async (req, res) => {
    const result = await paymentService.createPaymentIntent(req.user.id);

    res.json({
        status: 'success',
        data: result,
    });
});

export const handleWebhook = catchAsync(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
        throw new AppError('Missing Stripe signature', 400);
    }

    const result = await paymentService.handleWebhookEvent(req.body, signature);
    res.json(result);
});
