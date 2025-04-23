/**
 * Driver Location Service
 * Service for tracking and retrieving driver locations
 */
const DriverLocation = require('../models/driverLocation.model');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

/**
 * Record a new driver location
 * @param {Object} locationData - Location data including driver ID, coordinates
 * @returns {Promise<Object>} Saved location record
 */
const recordLocation = async (locationData) => {
  // Verify driver exists
  const driver = await User.findOne({ 
    _id: locationData.driverId, 
    role: 'driver',
    isActive: true
  });
  
  if (!driver) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Driver not found');
  }
  
  // Create location entry
  const locationEntry = await DriverLocation.create({
    driverId: locationData.driverId,
    location: {
      type: 'Point',
      coordinates: locationData.coordinates
    },
    timestamp: new Date(),
    tripId: locationData.tripId || null,
    source: locationData.source || 'background'
  });
  
  return locationEntry;
};

/**
 * Get the latest location for all drivers
 * @returns {Promise<Array>} Latest driver locations with driver info
 */
const getAllDriversLatestLocation = async () => {
  // Get all active drivers
  const drivers = await User.find({ 
    role: 'driver',
    isActive: true,
    deletedAt: null
  }, 'name email phone');
  
  // Create a lookup map
  const driverMap = drivers.reduce((map, driver) => {
    map[driver._id.toString()] = driver;
    return map;
  }, {});
  
  // For each driver, get their latest location
  const driverIds = drivers.map(driver => driver._id);
  
  // Use aggregation to get the latest location for each driver
  const latestLocations = await DriverLocation.aggregate([
    {
      $match: {
        driverId: { $in: driverIds },
        isActive: true
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$driverId',
        locationId: { $first: '$_id' },
        coordinates: { $first: '$location.coordinates' },
        timestamp: { $first: '$timestamp' },
        tripId: { $first: '$tripId' },
        source: { $first: '$source' }
      }
    },
    {
      $project: {
        _id: 0,
        driverId: '$_id',
        locationId: 1,
        coordinates: 1,
        timestamp: 1,
        tripId: 1,
        source: 1
      }
    }
  ]);
  
  // Combine driver info with their latest location
  const result = latestLocations.map(location => {
    const driverId = location.driverId.toString();
    return {
      ...location,
      driver: driverMap[driverId] || null
    };
  });
  
  return result;
};

/**
 * Get location history for a specific driver
 * @param {string} driverId - Driver ID
 * @param {Object} options - Query options (timeframe, pagination, etc.)
 * @returns {Promise<Object>} Paginated location history
 */
const getDriverLocationHistory = async (driverId, options = {}) => {
  // Verify driver exists
  const driver = await User.findOne({ 
    _id: driverId, 
    role: 'driver',
    isActive: true
  });
  
  if (!driver) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Driver not found');
  }
  
  // Build filter
  const filter = { 
    driverId,
    isActive: true 
  };
  
  // Add time filter if provided
  if (options.startTime || options.endTime) {
    filter.timestamp = {};
    
    if (options.startTime) {
      filter.timestamp.$gte = new Date(options.startTime);
    }
    
    if (options.endTime) {
      filter.timestamp.$lte = new Date(options.endTime);
    }
  }
  
  // Get paginated results
  const locations = await DriverLocation.paginate(filter, {
    sort: { timestamp: -1 },
    limit: options.limit ? parseInt(options.limit, 10) : 50,
    page: options.page ? parseInt(options.page, 10) : 1
  });
  
  return {
    ...locations,
    driver: {
      _id: driver._id,
      name: driver.name,
      phone: driver.phone,
      email: driver.email
    }
  };
};

/**
 * Get the latest location for a specific driver
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} Latest location with driver info
 */
const getDriverLatestLocation = async (driverId) => {
  // Verify driver exists
  const driver = await User.findOne({ 
    _id: driverId, 
    role: 'driver',
    isActive: true
  });
  
  if (!driver) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Driver not found');
  }
  
  // Get latest location
  const latestLocation = await DriverLocation.findOne(
    { driverId, isActive: true },
    {},
    { sort: { timestamp: -1 } }
  );
  
  if (!latestLocation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No location data found for this driver');
  }
  
  return {
    driverId: driver._id,
    locationId: latestLocation._id,
    coordinates: latestLocation.location.coordinates,
    timestamp: latestLocation.timestamp,
    tripId: latestLocation.tripId,
    source: latestLocation.source,
    driver: {
      name: driver.name,
      phone: driver.phone,
      email: driver.email
    }
  };
};

module.exports = {
  recordLocation,
  getAllDriversLatestLocation,
  getDriverLocationHistory,
  getDriverLatestLocation
}; 