/**
 * Wraps an async function and catches any errors, passing them to the Express error handler
 * This eliminates the need for try/catch blocks in route handlers
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - The wrapped function that forwards errors to Express error middleware
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = catchAsync; 