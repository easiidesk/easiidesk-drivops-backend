/**
 * Driver Location Controller
 * Handles APIs for driver location tracking
 */
const driverLocationService = require('../services/driverLocation.service');
const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

/**
 * Record driver's current location
 * @route POST /api/driver-locations
 */
const recordLocation = catchAsync(async (req, res) => {
  const { coordinates, tripId, source } = req.body;
  
  // Use authenticated user's ID if driver is making the request
  let driverId = req.body.driverId;
  
  if (req.user.role === 'driver') {
    driverId = req.user._id;
  } else if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
    throw new ApiError(httpStatus.status.FORBIDDEN, 'Only drivers can update their own location, or admins can update any driver location');
  }
  
  const locationData = {
    driverId,
    coordinates,
    tripId,
    source
  };
  
  const locationEntry = await driverLocationService.recordLocation(locationData);
  
  return res.status(httpStatus.status.CREATED).json({
    success: true,
    message: 'Location recorded successfully',
    data: locationEntry
  });
});

/**
 * Get latest location for all drivers
 * @route GET /api/driver-locations/latest
 * @access Private - Admin, Super Admin, Scheduler
 */
const getAllDriversLatestLocation = catchAsync(async (req, res) => {
  const locations = await driverLocationService.getAllDriversLatestLocation();
  
  return res.status(httpStatus.status.OK).json({
    success: true,
    data: locations
  });
});

/**
 * Get location history for a specific driver
 * @route GET /api/driver-locations/:driverId/history
 * @access Private - Admin, Super Admin, Scheduler
 */
const getDriverLocationHistory = catchAsync(async (req, res) => {
  const { driverId } = req.params;
  const { startTime, endTime, page, limit } = req.query;
  
  const history = await driverLocationService.getDriverLocationHistory(driverId, {
    startTime,
    endTime,
    page,
    limit
  });
  
  return res.status(httpStatus.status.OK).json({
    success: true,
    data: history
  });
});

/**
 * Get latest location for a specific driver
 * @route GET /api/driver-locations/:driverId/latest
 * @access Private - Admin, Super Admin, Scheduler
 */
const getDriverLatestLocation = catchAsync(async (req, res) => {
  const { driverId } = req.params;
  
  const location = await driverLocationService.getDriverLatestLocation(driverId);
  
  return res.status(httpStatus.status.OK).json({
    success: true,
    data: location
  });
});

module.exports = {
  recordLocation,
  getAllDriversLatestLocation,
  getDriverLocationHistory,
  getDriverLatestLocation
}; 