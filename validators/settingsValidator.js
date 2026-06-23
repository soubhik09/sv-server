import Joi from 'joi';

export const updateSettingsSchema = Joi.object({
  companyName: Joi.string().trim().max(200).optional(),
  proprietor: Joi.string().trim().max(200).optional(),
  phone: Joi.string().trim().max(50).optional(),
  email: Joi.string().email().trim().allow('').optional().messages({
    'string.email': 'Please provide a valid email',
  }),
  address: Joi.string().trim().max(500).optional(),
  invoicePrefix: Joi.string().trim().max(10).optional(),
  invoiceYearlyReset: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});
