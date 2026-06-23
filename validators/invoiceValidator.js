import Joi from 'joi';

const invoiceItemSchema = Joi.object({
  qty: Joi.number().min(0).required().messages({
    'number.min': 'Quantity must be 0 or more',
    'any.required': 'Item quantity is required',
  }),
  description: Joi.string().trim().required().messages({
    'any.required': 'Item description is required',
  }),
  weight: Joi.number().min(0).optional(),
  qom: Joi.string().trim().optional(),
  rate: Joi.number().min(0).required().messages({
    'number.min': 'Rate must be 0 or more',
    'any.required': 'Item rate is required',
  }),
  amount: Joi.number().min(0).required().messages({
    'number.min': 'Amount must be 0 or more',
    'any.required': 'Item amount is required',
  }),
});

export const createInvoiceSchema = Joi.object({
  date: Joi.date().iso().optional(),
  customer: Joi.string().regex(/^[0-9a-fA-F]{24}$/).allow(null).optional().messages({
    'string.pattern.base': 'Invalid customer ID format',
  }),
  customerName: Joi.string().trim().max(200).required().messages({
    'any.required': 'Customer name is required',
    'string.max': 'Customer name must not exceed 200 characters',
  }),
  customerPhone: Joi.string().allow('').trim().max(20).optional(),
  customerAddress: Joi.string().allow('').trim().max(500).optional(),
  items: Joi.array().items(invoiceItemSchema).min(1).required().messages({
    'array.min': 'At least one item is required',
    'any.required': 'Items are required',
  }),
  transport: Joi.string().allow('').trim().optional(),
  chargeableValue: Joi.number().min(0).optional(),
  previousDue: Joi.number().min(0).optional(),
  roundOff: Joi.number().optional(),
  originalGrandTotal: Joi.number().min(0).optional(),
  discount: Joi.number().min(0).optional(),
  grandTotal: Joi.number().min(0).required().messages({
    'number.min': 'Grand total must be 0 or more',
    'any.required': 'Grand total is required',
  }),
  pay: Joi.number().min(0).optional(),
});

export const updateInvoiceSchema = Joi.object({
  date: Joi.date().iso().optional(),
  customer: Joi.string().regex(/^[0-9a-fA-F]{24}$/).allow(null).optional().messages({
    'string.pattern.base': 'Invalid customer ID format',
  }),
  customerName: Joi.string().trim().max(200).optional(),
  customerPhone: Joi.string().allow('').trim().max(20).optional(),
  customerAddress: Joi.string().allow('').trim().max(500).optional(),
  items: Joi.array().items(invoiceItemSchema).min(1).optional(),
  transport: Joi.string().allow('').trim().optional(),
  chargeableValue: Joi.number().min(0).optional(),
  previousDue: Joi.number().min(0).optional(),
  roundOff: Joi.number().optional(),
  grandTotal: Joi.number().min(0).optional(),
  pay: Joi.number().min(0).optional(),
  paidBy: Joi.string().allow('').trim().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});
