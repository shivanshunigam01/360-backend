const Joi = require("joi");

exports.createVendor = {
  body: Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().email().required(),
    contactNumber: Joi.string().optional(),
    creditDays: Joi.number().min(0).required(),
    region: Joi.string().required(),
    gstin: Joi.string().required()
  })
};

exports.updateVendor = {
  body: Joi.object({
    name: Joi.string().trim().optional(),
    email: Joi.string().email().optional(),
    contactNumber: Joi.string().optional(),
    creditDays: Joi.number().min(0).optional(),
    region: Joi.string().optional(),
    gstin: Joi.string().optional()
  }).min(1) // at least one field required
};
