import Joi from 'joi';

export const summarySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

export const trendsSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  groupBy: Joi.string().valid('day', 'week', 'month', 'year').optional(),
});

export const exportSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  status: Joi.string().valid('Paid', 'Unpaid', 'Partial', 'Carry-Forward').optional(),
});
