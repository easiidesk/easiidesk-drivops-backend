const semver = require('semver');
const env = require('../../config/env');

/**
 * Extract app version and platform from request headers
 * @param {Object} req - Express request object
 * @returns {Object} App version information
 */
const getVersionFromRequest = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const appVersion = req.headers['app-version'] || '';
  
  let platform = 'web';
  
  // Detect platform from user agent
  if (/android/i.test(userAgent)) {
    platform = 'android';
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    platform = 'ios';
  }
  
  return {
    version: appVersion,
    platform
  };
};

/**
 * Check if app version meets minimum requirements
 * @param {Object} req - Express request object
 * @returns {boolean} True if version is valid
 */
const checkVersionFromRequest = (req) => {
  // Skip version check in development mode
  if (env.NODE_ENV === 'development' && !env.FORCE_VERSION_CHECK) {
    return true;
  }
  
  // Get version info from request
  const { version, platform } = getVersionFromRequest(req);
  
  // If no version provided, use the web minimum (for browser access)
  if (!version) {
    return true;
  }
  
  // Get minimum version for platform
  let minVersion;
  switch (platform) {
    case 'android':
      minVersion = env.MINIMUM_VERSION_ANDROID;
      break;
    case 'ios':
      minVersion = env.MINIMUM_VERSION_IOS;
      break;
    default:
      minVersion = env.MINIMUM_VERSION_WEB;
  }
  
  // Check version
  return minVersion ? semver.gte(version, minVersion) : true;
};

module.exports = {
  getVersionFromRequest,
  checkVersionFromRequest
};