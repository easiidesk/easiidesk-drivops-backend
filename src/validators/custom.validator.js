const { ObjectId } = require('mongodb');

/**
 * Custom validation for MongoDB ObjectId
 * @param {string} value - The value to validate
 * @param {Object} helpers - Joi helper object
 * @returns {string|Error} - Returns the value if valid, or throws an error
 */
const objectId = (value, helpers) => {
  if (!value) {
    return value;
  }

  // Check if the string is a valid ObjectId
  if (!ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }

  return value;
};

module.exports = {
  objectId,
}; 