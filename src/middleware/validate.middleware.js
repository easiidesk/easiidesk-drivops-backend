const { errorResponse } = require('../common/responses/response.utils');

/**
 * Request body validation middleware
 * @param {Object} schema - Validation schema (Joi or Yup)
 * @returns {Function} Middleware function
 */
const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      // Check if this is a Joi schema (has 'body' property)
      if (schema.body) {
        const { error, value } = schema.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true
        });
        
        if (error) {
          throw error;
        }
        
        // Replace request body with validated data
        req.body = value;
      } else {
        // Assume Yup schema
        const validatedData = await schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true
        });
        
        // Replace request body with validated data
        req.body = validatedData;
      }
      
      next();
    } catch (error) {
      // Extract validation errors
      const errors = {};
      
      if (error.inner && error.inner.length > 0) {
        // Yup errors
        error.inner.forEach(err => {
          errors[err.path] = err.message;
        });
      } else if (error.details && error.details.length > 0) {
        // Joi errors
        error.details.forEach(err => {
          errors[err.path.join('.')] = err.message;
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
 * @param {Object} schema - Validation schema (Joi or Yup)
 * @returns {Function} Middleware function
 */
const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      // Check if this is a Joi schema (has 'params' property)
      if (schema.params) {
        const { error, value } = schema.params.validate(req.params, {
          abortEarly: false,
          stripUnknown: true
        });
        
        if (error) {
          throw error;
        }
        
        // Replace request params with validated data
        req.params = value;
      } else {
        // Assume Yup schema
        const validatedData = await schema.validate(req.params, {
          abortEarly: false,
          stripUnknown: true
        });
        
        // Replace request params with validated data
        req.params = validatedData;
      }
      
      next();
    } catch (error) {
      // Extract validation errors
      const errors = {};
      
      if (error.inner && error.inner.length > 0) {
        // Yup errors
        error.inner.forEach(err => {
          errors[err.path] = err.message;
        });
      } else if (error.details && error.details.length > 0) {
        // Joi errors
        error.details.forEach(err => {
          errors[err.path.join('.')] = err.message;
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
 * @param {Object} schema - Validation schema (Joi or Yup)
 * @returns {Function} Middleware function
 */
const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      if(!req.query) {
        req.query = {};
        next();
        return;
      }
      
      // Check if this is a Joi schema (has 'query' property)
      if (schema.query) {
        Object.keys(req.query).forEach(key => {
          if(req.query[key].split(',').length !== 1) {
            req.query[key] = req.query[key].split(',');
          }
        });
        const { error, value } = schema.query.validate(req.query, {
          abortEarly: false,
          stripUnknown: true
        });
        
        if (error) {
          throw error;
        }
        
        // Replace request query with validated data
        req.query = value;
      } else {
        // Assume Yup schema
        const validatedData = await schema.validate(req.query, {
          abortEarly: false,
          stripUnknown: true
        });
        
        // Replace request query with validated data
        req.query = validatedData;
      }
      
      next();
    } catch (error) {
      // Extract validation errors
      const errors = {};
      
      if (error.inner && error.inner.length > 0) {
        // Yup errors
        error.inner.forEach(err => {
          errors[err.path] = err.message;
        });
      } else if (error.details && error.details.length > 0) {
        // Joi errors
        error.details.forEach(err => {
          errors[err.path.join('.')] = err.message;
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