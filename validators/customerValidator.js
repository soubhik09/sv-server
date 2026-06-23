import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.min': 'Customer name is required',
    'string.max': 'Name must not exceed 200 characters',
    'any.required': 'Customer name is required',
  }),
  phone: Joi.string().trim().min(7).max(20).required().messages({
    'string.min': 'Phone number must be at least 7 digits',
    'string.max': 'Phone number must not exceed 20 characters',
    'any.required': 'Phone number is required',
  }),
  address: Joi.string().allow('').trim().max(500).optional(),
  gstin: Joi.string().allow('').trim().max(50).optional(),
  email: Joi.string().allow('').email().trim().optional().messages({
    'string.email': 'Please provide a valid email',
  }),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  phone: Joi.string().trim().min(7).max(20).optional(),
  address: Joi.string().allow('').trim().max(500).optional(),
  gstin: Joi.string().allow('').trim().max(50).optional(),
  email: Joi.string().allow('').email().trim().optional().messages({
    'string.email': 'Please provide a valid email',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});
