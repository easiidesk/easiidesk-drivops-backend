const { errorResponse } = require('../common/responses/response.utils');
const { checkVersionFromRequest } = require('../common/utils/version');

/**
 * Middleware to check app version
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const versionCheck = (req, res, next) => {
  // Skip version check for certain paths
  const skipPaths = ['/health', '/api-docs'];
  
  if (skipPaths.some(path => req.path.includes(path))) {
    return next();
  }
  
  // Check app version
  if (!checkVersionFromRequest(req)) {
    return res.status(426).json(
      errorResponse('App version outdated. Please update your application.', 426)
    );
  }
  
  next();
};

module.exports = versionCheck; 