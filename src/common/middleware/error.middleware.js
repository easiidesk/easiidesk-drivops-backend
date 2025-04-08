const { errorResponse } = require('../responses/response.utils');

/**
 * Global error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle different types of errors
  if (err.name === 'ValidationError') {
    // Mongoose/Yup validation error
    const errors = {};
    
    if (err.inner) {
      // Yup validation error
      err.inner.forEach(e => {
        errors[e.path] = e.message;
      });
    } else if (err.errors) {
      // Mongoose validation error
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
      });
    }
    
    return res.status(400).json(errorResponse('Validation error', 400, errors));
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    // MongoDB duplicate key error
    return res.status(409).json(errorResponse('Duplicate entry', 409));
  }
  
  if (err.name === 'JsonWebTokenError') {
    // JWT error
    return res.status(401).json(errorResponse('Invalid token', 401));
  }
  
  if (err.name === 'TokenExpiredError') {
    // JWT expired
    return res.status(401).json(errorResponse('Token expired', 401));
  }
  
  if (err.name === 'UnauthorizedError') {
    // Authentication error
    return res.status(401).json(errorResponse('Unauthorized', 401));
  }
  
  // Default error handler
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  return res.status(statusCode).json(errorResponse(message, statusCode));
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  return res.status(404).json(errorResponse('Resource not found', 404));
};

module.exports = errorMiddleware;
module.exports.notFoundHandler = notFoundHandler; 