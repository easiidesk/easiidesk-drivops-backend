const Joi = require('joi');
const { objectId } = require('./custom.validator');

/**
 * Get schedules validation schema
 */
const getSchedules = {
  query: Joi.object().keys({
    driverId: Joi.custom(objectId),
    vehicleId: Joi.custom(objectId),
    dateFrom: Joi.date().iso(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

/**
 * Get schedule by id validation schema
 */
const getSchedule = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required(),
  }),
};

/**
 * Destination schema for creating/updating trip schedules
 */
const destinationSchema = Joi.object().keys({
  requestId: Joi.custom(objectId).allow(null),
  tripStartTime: Joi.date().iso().required(),
  tripApproxArrivalTime: Joi.date().iso().min(Joi.ref('tripStartTime')).allow(null),
  tripPurposeTime: Joi.number().integer().min(0).allow(null),
});

/**
 * Create schedule validation schema
 */
const createSchedule = {
  body: Joi.object().keys({
    driverId: Joi.custom(objectId).required(),
    vehicleId: Joi.custom(objectId).required(),
    destinations: Joi.array().items(destinationSchema).min(1).required(),
  }),
};

/**
 * Update schedule validation schema
 */
const updateSchedule = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      driverId: Joi.custom(objectId),
      vehicleId: Joi.custom(objectId),
      destinations: Joi.array().items(destinationSchema).min(1),
      isActive: Joi.boolean(),
    })
    .min(1),
};

/**
 * Delete schedule validation schema
 */
const deleteSchedule = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required(),
  }),
};

/**
 * Check availability validation schema
 */
const checkAvailability = {
  body: Joi.object().keys({
    vehicleId: Joi.custom(objectId).required(),
    driverId: Joi.custom(objectId).required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().min(Joi.ref('startTime')).required(),
    scheduleId: Joi.custom(objectId),
  }),
};

module.exports = {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  checkAvailability,
}; 