const { errorResponse } = require('../common/responses/response.utils');

/**
 * Request body validation middleware
 * @param {Object} schema - Yup schema
 * @returns {Function} Middleware function
 */
const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate request body against schema
      const validatedData = await schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });
      
      // Replace request body with validated data
      req.body = validatedData;
      
      next();
    } catch (error) {
      // Extract validation errors
      const errors = {};
      
      if (error.inner && error.inner.length > 0) {
        error.inner.forEach(err => {
          errors[err.path] = err.message;
        });
      }
      
      return res.status(400).json(
        errorResponse('Validation failed', 400, errors)
      );
    }
  };
};

/**
 * Request params validation middleware
 * @param {Object} schema - Yup schema
 * @returns {Function} Middleware function
 */
const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate request params against schema
      const validatedData = await schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true
      });
      
      // Replace request params with validated data
      req.params = validatedData;
      
      next();
    } catch (error) {
      // Extract validation errors
      const errors = {};
      
      if (error.inner && error.inner.length > 0) {
        error.inner.forEach(err => {
          errors[err.path] = err.message;
        });
      }
      
      return res.status(400).json(
        errorResponse('Invalid parameter(s)', 400, errors)
      );
    }
  };
};

/**
 * Request query validation middleware
 * @param {Object} schema - Yup schema
 * @returns {Function} Middleware function
 */
const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate request query against schema
      const validatedData = await schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });
      
      // Replace request query with validated data
      req.query = validatedData;
      
      next();
    } catch (error) {
      // Extract validation errors
      const errors = {};
      
      if (error.inner && error.inner.length > 0) {
        error.inner.forEach(err => {
          errors[err.path] = err.message;
        });
      }
      
      return res.status(400).json(
        errorResponse('Invalid query parameter(s)', 400, errors)
      );
    }
  };
};

module.exports = {
  validateRequest,
  validateParams,
  validateQuery
}; 