import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';


const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
