/**
 * Maintenance Record Validators
 * Request validation for maintenance record endpoints
 */
const Joi = require('joi');
const { objectId } = require('./custom.validator');

/**
 * Schema for validating maintenance record creation
 */
const createMaintenanceRecordSchema = {
  body: Joi.object().keys({
    vehicleId: Joi.string().required().custom(objectId)
      .description('Vehicle ID'),
    maintenanceType: Joi.string().required().valid('preventive', 'corrective', 'scheduled', 'emergency', 'other')
      .description('Type of maintenance'),
    description: Joi.string().required().min(5)
      .description('Description of the maintenance needed'),
    amount: Joi.number().required().min(0)
      .description('Estimated cost of maintenance'),
    odometer: Joi.number().optional().min(0).allow(null)
      .description('Current odometer reading'),
    serviceLocation: Joi.string().allow('', null)
      .description('Location where the service will be done'),
    
  })
};

/**
 * Schema for validating maintenance record update
 */
const updateMaintenanceRecordSchema = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
      .description('Maintenance record ID')
  }),
  body: Joi.object().keys({
    description: Joi.string().min(5)
      .description('Description of the maintenance needed'),
    amount: Joi.number().min(0)
      .description('Estimated cost of maintenance'),
    odometer: Joi.number().min(0)
      .description('Current odometer reading'),
    serviceLocation: Joi.string().allow('', null)
      .description('Location where the service will be done'),
    servicedBy: Joi.string().allow('', null)
      .description('Service provider name'),
    parts: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().required().min(1),
        cost: Joi.number().min(0)
      })
    )
      .description('Parts needed for the maintenance'),
    documents: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required()
      })
    )
      .description('Documents related to the maintenance'),
    notes: Joi.string().allow('', null)
      .description('Additional notes')
  }).min(1)
};

/**
 * Schema for validating approval status update
 */
const approvalSchema = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
      .description('Maintenance record ID')
  }),
  body: Joi.object().keys({
    status: Joi.string().required().valid('approved', 'rejected')
      .description('Approval status'),
    notes: Joi.string().allow('', null)
      .description('Notes about the approval decision')
  })
};

/**
 * Schema for validating completion status update
 */
const completionSchema = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
      .description('Maintenance record ID')
  }),
  body: Joi.object().keys({
    notes: Joi.string().allow('', null)
      .description('Notes about the completion')
  })
};

/**
 * Schema for validating maintenance record ID in route params
 */
const idParamSchema = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
      .description('Maintenance record ID')
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
    status: Joi.string().valid('pending', 'approved', 'completed', 'rejected')
      .description('Filter by status'),
    startDate: Joi.date()
      .description('Filter by start date (inclusive)'),
    endDate: Joi.date().min(Joi.ref('startDate'))
      .description('Filter by end date (inclusive)')
  })
};

module.exports = {
  createMaintenanceRecordSchema,
  updateMaintenanceRecordSchema,
  approvalSchema,
  completionSchema,
  idParamSchema,
  vehicleIdParamSchema,
  queryParamsSchema
}; 