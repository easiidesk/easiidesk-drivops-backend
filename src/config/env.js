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

};

module.exports = env; 