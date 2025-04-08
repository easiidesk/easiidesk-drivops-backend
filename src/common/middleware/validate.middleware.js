const { errorResponse } = require('../responses/response.utils');

/**
 * Validation middleware factory
 * @param {Object} schema - Yup schema for validation
 * @returns {Function} Express middleware
 */
const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate request body against schema
      await schema.validate(req.body, { abortEarly: false });
      next();
    } catch (error) {
      // Extract validation errors
      const errors = {};
      if (error.inner && error.inner.length > 0) {
        error.inner.forEach(err => {
          errors[err.path] = err.message;
        });
      }
      
      return res.status(400).json(errorResponse('Validation error', 400, errors));
    }
  };
};

/**
 * Validation middleware factory for query parameters
 * @param {Object} schema - Yup schema for validation
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate query parameters against schema
      const validatedQuery = await schema.validate(req.query, { 
        abortEarly: false,
        stripUnknown: true 
      });
      
      // Replace req.query with validated query
      req.query = validatedQuery;
      next();
    } catch (error) {
      // Extract validation errors
      const errors = {};
      if (error.inner && error.inner.length > 0) {
        error.inner.forEach(err => {
          errors[err.path] = err.message;
        });
      }
      
      return res.status(400).json(errorResponse('Invalid query parameters', 400, errors));
    }
  };
};

/**
 * Validation middleware factory for URL parameters
 * @param {Object} schema - Yup schema for validation
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate URL parameters against schema
      await schema.validate(req.params, { abortEarly: false });
      next();
    } catch (error) {
      // Extract validation errors
      const errors = {};
      if (error.inner && error.inner.length > 0) {
        error.inner.forEach(err => {
          errors[err.path] = err.message;
        });
      }
      
      return res.status(400).json(errorResponse('Invalid URL parameters', 400, errors));
    }
  };
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams
}; 