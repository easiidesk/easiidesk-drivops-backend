/**
 * Utility functions for HTTP responses
 */

// Default headers for all responses
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

/**
 * Create a success response
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} - Formatted response object
 */
const success = (data, statusCode = 200, message = 'Success',  additionalHeaders = {}) => {
  return {
    statusCode,
    headers: { ...defaultHeaders, ...additionalHeaders },
    body: JSON.stringify(data)
  };
};

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} errors - Additional error details
 * @returns {Object} - Formatted response object
 */
const error = (message, statusCode = 500, errors = null) => {
  const responseBody = {
    message
  };

  if (errors) {
    responseBody.errors = errors;
  }

  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(responseBody)
  };
};

module.exports = {
  success,
  error,
  defaultHeaders
}; 