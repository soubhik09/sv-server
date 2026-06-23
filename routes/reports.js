import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getSummary, getTrends, getExport } from '../controllers/reportController.js';

const router = express.Router();

router.get('/summary', protect, getSummary);
router.get('/trends', protect, getTrends);
router.get('/export', protect, getExport);

export default router;
