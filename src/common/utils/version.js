const semver = require('semver');
const {APP_VERSIONS}  = require('../../common/constants/version_constants');

/**
 * Extract app version and platform from request headers
 * @param {Object} req - Express request object
 * @returns {Object} App version information
 */
const getVersionFromRequest = (req) => {
  const platform = req.headers['platform'] || 'web';
  const appVersion = req.headers['app-version'] || '';
  
  
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

  
  // Get version info from request
  const { version, platform } = getVersionFromRequest(req);
  
  
  // Get minimum version for platform
  let minVersion;
  let currentVersion;
  let releaseNotes;
  switch (platform) {
    case 'android':
      minVersion = APP_VERSIONS.android.minimumVersion;
      currentVersion = APP_VERSIONS.android.currentVersion;
      releaseNotes = APP_VERSIONS.android.releaseNotes;
      break;
    case 'ios':
      minVersion = APP_VERSIONS.ios.minimumVersion;
      currentVersion = APP_VERSIONS.ios.currentVersion;
      releaseNotes = APP_VERSIONS.ios.releaseNotes;
      break;
    default:
      minVersion = APP_VERSIONS.android.minimumVersion;
      currentVersion = APP_VERSIONS.android.currentVersion;
      releaseNotes = APP_VERSIONS.android.releaseNotes;
      break;
  }
  
  // Check version
  return {
    minimumVersion: minVersion,
    currentVersion: currentVersion,
    releaseNotes: releaseNotes,
  }
};

module.exports = {
  getVersionFromRequest,
  checkVersionFromRequest
};