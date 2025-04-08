const Joi = require('joi');
const { objectId } = require('./custom.validator');

/**
 * Create maintenance validation schema
 * @type {Object}
 */
const createMaintenance = {
  body: Joi.object().keys({
    vehicle: Joi.custom(objectId).required().messages({
      'any.required': 'Vehicle ID is required',
      'string.pattern.name': 'Vehicle ID must be a valid ObjectId'
    }),
    type: Joi.string().valid('preventive', 'corrective', 'predictive', 'scheduled', 'emergency').required().messages({
      'any.required': 'Maintenance type is required',
      'any.only': 'Maintenance type must be one of: preventive, corrective, predictive, scheduled, emergency'
    }),
    title: Joi.string().required().min(3).max(100).messages({
      'any.required': 'Title is required',
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 100 characters'
    }),
    description: Joi.string().max(500).messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
    servicedBy: Joi.object({
      type: Joi.string().valid('internal', 'external').required(),
      name: Joi.string().required(),
      contact: Joi.string(),
      cost: Joi.number().min(0)
    }).messages({
      'any.required': 'Service provider details are required'
    }),
    odometer: Joi.number().min(0).messages({
      'number.min': 'Odometer reading cannot be negative'
    }),
    cost: Joi.number().min(0).messages({
      'number.min': 'Cost cannot be negative'
    }),
    parts: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        cost: Joi.number().min(0),
        notes: Joi.string()
      })
    ),
    scheduledDate: Joi.date().iso().messages({
      'date.format': 'Scheduled date must be in ISO format'
    }),
    startDate: Joi.date().iso().messages({
      'date.format': 'Start date must be in ISO format'
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).messages({
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date'
    }),
    duration: Joi.number().min(0).messages({
      'number.min': 'Duration cannot be negative'
    }),
    status: Joi.string().valid('pending', 'in-progress', 'completed', 'cancelled').default('pending').messages({
      'any.only': 'Status must be one of: pending, in-progress, completed, cancelled'
    }),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium').messages({
      'any.only': 'Priority must be one of: low, medium, high, critical'
    }),
    documents: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        type: Joi.string().required(),
        url: Joi.string().required(),
        size: Joi.number()
      })
    ),
    notes: Joi.string().max(500).messages({
      'string.max': 'Notes cannot exceed 500 characters'
    }),
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().ordered(
        Joi.number().min(-180).max(180).required(),
        Joi.number().min(-90).max(90).required()
      )
    })
  })
};

/**
 * Update maintenance validation schema
 * @type {Object}
 */
const updateMaintenance = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required().messages({
      'any.required': 'Maintenance ID is required',
      'string.pattern.name': 'Maintenance ID must be a valid ObjectId'
    })
  }),
  body: Joi.object().keys({
    type: Joi.string().valid('preventive', 'corrective', 'predictive', 'scheduled', 'emergency').messages({
      'any.only': 'Maintenance type must be one of: preventive, corrective, predictive, scheduled, emergency'
    }),
    title: Joi.string().min(3).max(100).messages({
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 100 characters'
    }),
    description: Joi.string().max(500).messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
    servicedBy: Joi.object({
      type: Joi.string().valid('internal', 'external').required(),
      name: Joi.string().required(),
      contact: Joi.string(),
      cost: Joi.number().min(0)
    }),
    odometer: Joi.number().min(0).messages({
      'number.min': 'Odometer reading cannot be negative'
    }),
    cost: Joi.number().min(0).messages({
      'number.min': 'Cost cannot be negative'
    }),
    parts: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        cost: Joi.number().min(0),
        notes: Joi.string()
      })
    ),
    scheduledDate: Joi.date().iso().messages({
      'date.format': 'Scheduled date must be in ISO format'
    }),
    startDate: Joi.date().iso().messages({
      'date.format': 'Start date must be in ISO format'
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).messages({
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date'
    }),
    duration: Joi.number().min(0).messages({
      'number.min': 'Duration cannot be negative'
    }),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').messages({
      'any.only': 'Priority must be one of: low, medium, high, critical'
    }),
    documents: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        type: Joi.string().required(),
        url: Joi.string().required(),
        size: Joi.number()
      })
    ),
    notes: Joi.string().max(500).messages({
      'string.max': 'Notes cannot exceed 500 characters'
    }),
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().ordered(
        Joi.number().min(-180).max(180).required(),
        Joi.number().min(-90).max(90).required()
      )
    })
  }).min(1) // At least one field must be updated
};

/**
 * Update maintenance status validation schema
 * @type {Object}
 */
const updateStatus = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required().messages({
      'any.required': 'Maintenance ID is required',
      'string.pattern.name': 'Maintenance ID must be a valid ObjectId'
    })
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('pending', 'in-progress', 'completed', 'cancelled').required().messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be one of: pending, in-progress, completed, cancelled'
    }),
    notes: Joi.string().max(500).messages({
      'string.max': 'Notes cannot exceed 500 characters'
    })
  })
};

/**
 * Add document validation schema
 * @type {Object}
 */
const addDocument = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required().messages({
      'any.required': 'Maintenance ID is required',
      'string.pattern.name': 'Maintenance ID must be a valid ObjectId'
    })
  }),
  body: Joi.object().keys({
    name: Joi.string().required().messages({
      'any.required': 'Document name is required'
    }),
    type: Joi.string().required().messages({
      'any.required': 'Document type is required'
    }),
    url: Joi.string().required().messages({
      'any.required': 'Document URL is required'
    }),
    size: Joi.number().min(0),
    notes: Joi.string().max(200).messages({
      'string.max': 'Notes cannot exceed 200 characters'
    })
  })
};

/**
 * Get maintenance by ID validation schema
 * @type {Object}
 */
const getById = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required().messages({
      'any.required': 'Maintenance ID is required',
      'string.pattern.name': 'Maintenance ID must be a valid ObjectId'
    })
  })
};

/**
 * Get maintenance by vehicle validation schema
 * @type {Object}
 */
const getByVehicle = {
  params: Joi.object().keys({
    vehicleId: Joi.custom(objectId).required().messages({
      'any.required': 'Vehicle ID is required',
      'string.pattern.name': 'Vehicle ID must be a valid ObjectId'
    })
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    status: Joi.string().valid('pending', 'in-progress', 'completed', 'cancelled')
  })
};

/**
 * Delete maintenance validation schema
 * @type {Object}
 */
const deleteMaintenance = {
  params: Joi.object().keys({
    id: Joi.custom(objectId).required().messages({
      'any.required': 'Maintenance ID is required',
      'string.pattern.name': 'Maintenance ID must be a valid ObjectId'
    })
  })
};

module.exports = {
  createMaintenance,
  updateMaintenance,
  updateStatus,
  addDocument,
  getById,
  getByVehicle,
  deleteMaintenance
}; 