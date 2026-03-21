import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import * as paymentController from '../controllers/paymentController.js';

const router = Router();

// Public — client needs the publishable key to initialize Stripe.js
router.get('/config', paymentController.getConfig);

// Protected — must be logged in to create a payment
router.post('/create-intent', authenticate, paymentController.createIntent);

export default router;
