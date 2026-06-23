import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';
import { loginSchema, refreshTokenSchema, changePasswordSchema, createStaffSchema } from '../validators/authValidator.js';
import {
  login, refresh, getMe, changePassword,
  getStaff, createStaff, deleteStaff,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.get('/me', protect, getMe);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);
router.get('/staff', protect, adminOnly, getStaff);
router.post('/staff', protect, adminOnly, validate(createStaffSchema), createStaff);
router.delete('/staff/:id', protect, adminOnly, deleteStaff);

export default router;
