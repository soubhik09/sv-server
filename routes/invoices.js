import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';
import { createInvoiceSchema, updateInvoiceSchema } from '../validators/invoiceValidator.js';
import {
  getNextNumber, getInvoices, getInvoice,
  createInvoice, updateInvoice, deleteInvoice,
} from '../controllers/invoiceController.js';

const router = express.Router();

router.get('/next-number', protect, getNextNumber);
router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoice);
router.post('/', protect, validate(createInvoiceSchema), createInvoice);
router.put('/:id', protect, validate(updateInvoiceSchema), updateInvoice);
router.delete('/:id', protect, deleteInvoice);

export default router;
