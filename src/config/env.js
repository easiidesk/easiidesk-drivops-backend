require('dotenv').config();

/**
 * Environment configuration
 */
const env = {
  // Server
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  MONGODB_URI: process.env.MONGODB_URI,

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET,

  // Version control
  MINIMUM_VERSION_ANDROID: process.env.MINIMUM_VERSION_ANDROID || '1.0.0',
  MINIMUM_VERSION_IOS: process.env.MINIMUM_VERSION_IOS || '1.0.0',
  MINIMUM_VERSION_WEB: process.env.MINIMUM_VERSION_WEB || '1.0.0',
  FORCE_VERSION_CHECK: process.env.FORCE_VERSION_CHECK === 'true'
};

module.exports = env; 