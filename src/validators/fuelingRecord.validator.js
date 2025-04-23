/**
 * Fueling Record Validators
 * Request validation for fueling record endpoints
 */
const Joi = require('joi');
const { objectId } = require('./custom.validator');

/**
 * Schema for validating fueling record creation
 */
const createFuelingRecordSchema = {
  body: Joi.object().keys({
    vehicleId: Joi.string().required().custom(objectId)
      .description('Vehicle ID'),
    amount: Joi.number().required().min(0)
      .description('Amount of fuel in liters/gallons'),
    odometer: Joi.number().required().min(0)
      .description('Current odometer reading'),
    fueledAt: Joi.date().max('now')
      .description('Date and time of fueling'),
    location: Joi.string().allow('', null)
      .description('Location where the fueling was done'),
    notes: Joi.string().allow('', null)
      .description('Additional notes')
  })
};

/**
 * Schema for validating fueling record update
 */
const updateFuelingRecordSchema = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
      .description('Fueling record ID')
  }),
  body: Joi.object().keys({
    amount: Joi.number().min(0)
      .description('Amount of fuel in liters/gallons'),
    cost: Joi.number().min(0)
      .description('Cost of fuel'),
    odometer: Joi.number().min(0)
      .description('Current odometer reading'),
    fueledAt: Joi.date().max('now')
      .description('Date and time of fueling'),
    fuelType: Joi.string().valid('petrol', 'diesel', 'electric', 'cng', 'lpg')
      .description('Type of fuel'),
    location: Joi.string().allow('', null)
      .description('Location where the fueling was done'),
    notes: Joi.string().allow('', null)
      .description('Additional notes'),
    receiptImage: Joi.string().allow('', null)
      .description('URL of the receipt image')
  }).min(1)
};

/**
 * Schema for validating fueling record ID in route params
 */
const idParamSchema = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
      .description('Fueling record ID')
  })
};

/**
 * Schema for validating vehicle ID in route params
 */
const vehicleIdParamSchema = {
  params: Joi.object().keys({
    vehicleId: Joi.string().required().custom(objectId)
      .description('Vehicle ID')
  })
};

/**
 * Schema for validating pagination and filter query params
 */
const queryParamsSchema = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1)
      .description('Page number (default: 1)'),
    limit: Joi.number().integer().min(1).max(100)
      .description('Number of records per page (default: 10)'),
    vehicleId: Joi.string().custom(objectId)
      .description('Filter by vehicle ID'),
    startDate: Joi.date()
      .description('Filter by start date (inclusive)'),
    endDate: Joi.date().min(Joi.ref('startDate'))
      .description('Filter by end date (inclusive)')
  })
};

module.exports = {
  createFuelingRecordSchema,
  updateFuelingRecordSchema,
  idParamSchema,
  vehicleIdParamSchema,
  queryParamsSchema
}; 