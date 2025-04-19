const { errorResponse } = require('../common/responses/response.utils');

/**
 * 404 Not Found middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  return res.status(404).json(
    errorResponse(`Cannot ${req.method} ${req.originalUrl}`, 404)
  );
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log error in development and staging
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  // Check if error has status code
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const data = err.data || null;

  // Send error response
  return res.status(statusCode).json(
    errorResponse(message, statusCode, data)
  );
};

module.exports = errorHandler;
module.exports.notFoundHandler = notFoundHandler; 