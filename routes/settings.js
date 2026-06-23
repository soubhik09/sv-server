import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';
import { updateSettingsSchema } from '../validators/settingsValidator.js';
import { getSettings, updateSettings, resetInvoiceCounter } from '../controllers/settingsController.js';

const router = express.Router();

router.get('/', protect, getSettings);
router.put('/', protect, adminOnly, validate(updateSettingsSchema), updateSettings);
router.put('/reset-invoice', protect, adminOnly, resetInvoiceCounter);

export default router;
