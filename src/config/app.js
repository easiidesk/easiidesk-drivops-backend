const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { notFoundHandler } = require('../middleware/error.middleware');
const errorMiddleware = require('../middleware/error.middleware');
const versionCheck = require('../middleware/version.middleware');
const { setupSwagger } = require('./swagger');
const env = require('./env');

/**
 * Initialize Express application with middleware
 * @returns {Object} Express application
 */
function initializeApp() {
  const app = express();
  
  // Basic middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Add request logging in development mode
  if (env.NODE_ENV === 'development') {
    const morgan = require('morgan');
    app.use(morgan('dev'));
  }
  
  // Setup Swagger documentation
  setupSwagger(app);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  return app;
}

/**
 * Apply API routes to Express application
 * @param {Object} app - Express application
 * @param {Object} routes - Route modules
 * @returns {Object} Express application with routes
 */
function applyRoutes(app, routes) {
  // Apply global app version check middleware
  app.use(`/`, versionCheck);
  
  // Apply each route module
  Object.entries(routes).forEach(([path, router]) => {
    app.use(`/${path}`, router);
  });
  
  // Apply error handlers
  app.use(notFoundHandler);
  app.use(errorMiddleware);
  
  return app;
}

module.exports = {
  initializeApp,
  applyRoutes
}; 