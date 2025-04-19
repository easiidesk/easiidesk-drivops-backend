/**
 * Format successful response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted response
 */
const successResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    statusCode,
    data
  };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} errors - Validation errors or additional data
 * @returns {Object} Formatted error response
 */
const errorResponse = (message = 'Error', statusCode = 500, data = null) => {
  const response = {
    success: false,
    message,
    statusCode
  };
  
  if (data) {
    if (typeof data === 'object' && data.hasOwnProperty('errors')) {
      response.errors = data.errors;
    } else {
      response.data = data;
    }
  }
  
  return response;
};

module.exports = {
  successResponse,
  errorResponse
}; 