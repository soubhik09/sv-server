import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customerValidator.js';
import {
  getCustomers, getCustomer, createCustomer,
  updateCustomer, deleteCustomer, getCustomerInvoices,
} from '../controllers/customerController.js';

const router = express.Router();

router.get('/', protect, getCustomers);
router.get('/:id', protect, getCustomer);
router.post('/', protect, validate(createCustomerSchema), createCustomer);
router.put('/:id', protect, validate(updateCustomerSchema), updateCustomer);
router.delete('/:id', protect, deleteCustomer);
router.get('/:id/invoices', protect, getCustomerInvoices);

export default router;
