/**
 * Driver Location Routes
 * Defines routes for driver location tracking and retrieval
 */
const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth.middleware');
const driverLocationController = require('../controllers/driverLocation.controller');

const router = express.Router();

// Protect all routes with authentication
router.use(verifyToken);

// Record driver location - drivers can record their own, admins can record for any
router.post(
  '/',
  authorize(['driver']),
  driverLocationController.recordLocation
);

// Get latest location for all drivers - admin only
router.get(
  '/latest',
  authorize(['admin', 'super-admin']),
  driverLocationController.getAllDriversLatestLocation
);

// Get location history for a specific driver - admin only
router.get(
  '/:driverId/history',
  authorize(['admin', 'super-admin', 'scheduler']),
  driverLocationController.getDriverLocationHistory
);

// Get latest location for a specific driver - admin only
router.get(
  '/:driverId/latest',
  authorize(['admin', 'super-admin', 'scheduler']),
  driverLocationController.getDriverLatestLocation
);

module.exports = router; 