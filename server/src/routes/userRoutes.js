import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import * as userController from '../controllers/userController.js';


const router = Router();

router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, userController.updateMe);


//Admin Only Route
router.get('/', authenticate, authorize('admin'), userController.listUsers);

export default router;
