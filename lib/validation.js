import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().optional(),
});

export const addressSchema = Joi.object({
  label: Joi.string().min(1).max(100).required(),
  address: Joi.string().required(),
  type: Joi.string().valid('evm', 'bitcoin').required(),
});
