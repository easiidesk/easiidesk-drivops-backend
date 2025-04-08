/**
 * Class representing an API error
 * @extends Error
 */
class ApiError extends Error {
  /**
   * Creates an API error.
   * @param {number} statusCode - HTTP status code of error
   * @param {string} message - Error message
   * @param {boolean} isOperational - Whether the error is operational or programming
   * @param {string} stack - Stack trace
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError; 