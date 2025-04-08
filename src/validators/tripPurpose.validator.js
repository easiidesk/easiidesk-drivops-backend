const Joi = require('joi');
const { objectId } = require('./custom.validator');

/**
 * Get trip purposes validation schema
 */
const getTripPurposes = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

/**
 * Get trip purpose by id validation schema
 */
const getTripPurpose = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required(),
  }),
};

/**
 * Create trip purpose validation schema
 */
const createTripPurpose = {
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(100),
    jobCardNeeded: Joi.boolean().required(),
    defaultDestination: Joi.string().allow('', null),
  }),
};

/**
 * Update trip purpose validation schema
 */
const updateTripPurpose = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().min(2).max(100),
      jobCardNeeded: Joi.boolean(),
      defaultDestination: Joi.string().allow('', null),
    })
    .min(1),
};

/**
 * Delete trip purpose validation schema
 */
const deleteTripPurpose = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required(),
  }),
};

module.exports = {
  getTripPurposes,
  getTripPurpose,
  createTripPurpose,
  updateTripPurpose,
  deleteTripPurpose,
}; 