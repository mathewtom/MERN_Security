import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import * as userController from '../controllers/userController.js';
import validate from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/userValidators.js';


const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);


//Admin Only Route
router.get('/', authorize('admin'), userController.listUsers);

export default router;
