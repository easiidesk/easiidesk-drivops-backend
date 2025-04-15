const Joi = require('joi');
const { objectId } = require('./custom.validator');

/**
 * Get trip requests validation schema
 */
const getTripRequests = {
  query: Joi.object().keys({
    status: Joi.alternatives().try(
      Joi.string().valid('pending', 'scheduled', 'cancelled'),
      Joi.array().items(Joi.string().valid('pending', 'scheduled', 'cancelled'))
    ),
    vehicleId: Joi.string().allow('', null).optional(),
    driverId: Joi.string().allow('', null).optional(),
    dateFrom: Joi.date().iso(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
    createdBy: Joi.custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

/**
 * Get trip request by id validation schema
 */
const getTripRequest = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required(),
  }),
};

/**
 * Create trip request validation schema
 */
const createTripRequest = {
  body: Joi.object().keys({
    destination: Joi.string().required().trim(),
    isWaiting: Joi.boolean().optional().allow(null),
    mapLink: Joi.string().allow('', null),
    dateTime: Joi.date().iso().required(),
    timeType: Joi.string().valid('any', 'morning', 'afternoon', 'evening').optional().allow(null),
    purpose: Joi.custom(objectId).required(),
    jobCardId: Joi.string().allow('', null),
    noOfPeople: Joi.number().integer().required(),
    requiredVehicle: Joi.array().items(
      Joi.alternatives().try(
        Joi.custom(objectId),
        Joi.string().valid('Any Car', 'Any Van', 'Any Truck')
      )
    ).min(1).required(),
  }),
};

/**
 * Update trip request validation schema
 */
const updateTripRequest = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      destination: Joi.string().trim(),
      isWaiting: Joi.boolean().optional().allow(null),
      mapLink: Joi.string().allow('', null),
      dateTime: Joi.date().iso(),
      timeType: Joi.string().valid('any', 'morning', 'afternoon', 'evening').optional().allow(null),
      purpose: Joi.custom(objectId),
      jobCardId: Joi.string().allow('', null),
      noOfPeople: Joi.number().integer(),
      requiredVehicle: Joi.array().items(
        Joi.alternatives().try(
          Joi.custom(objectId),
          Joi.string().valid('Any Car', 'Any Van', 'Any Truck')
        )
      ).min(1),
      status: Joi.string().valid('pending', 'scheduled', 'cancelled'),
      cancelRemarks: Joi.string().allow('', null).optional(),
    })
    .min(1),
};

/**
 * Delete trip request validation schema
 */
const deleteTripRequest = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required(),
  }),
};

module.exports = {
  getTripRequests,
  getTripRequest,
  createTripRequest,
  updateTripRequest,
  deleteTripRequest,
}; 