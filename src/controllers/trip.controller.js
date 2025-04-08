const tripService = require('../services/trip.service');
const { successResponse, errorResponse } = require('../common/responses/response.utils');

/**
 * Get all trips
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getTrips = async (req, res, next) => {
  try {
    // Extract query parameters
    const { 
      page = 1, 
      limit = 10, 
      status, 
      startDate, 
      endDate,
      search 
    } = req.query;
    
    // Build filters
    const filters = {};
    
    if (status) {
      filters.status = status;
    }
    
    // Date range filters
    if (startDate || endDate) {
      filters.scheduledStartTime = {};
      
      if (startDate) {
        filters.scheduledStartTime.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filters.scheduledStartTime.$lte = new Date(endDate);
      }
    }
    
    // Search implementation
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build options
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { scheduledStartTime: -1 }
    };
    
    // Get trips
    const result = await tripService.getTrips(filters, options);
    
    return res.status(200).json(successResponse(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get trip by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get trip
    const trip = await tripService.getTripById(id);
    
    if (!trip) {
      return res.status(404).json(errorResponse('Trip not found', 404));
    }
    
    return res.status(200).json(successResponse(trip));
  } catch (err) {
    next(err);
  }
};

/**
 * Get trips for a driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getTripsByDriver = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    // Build options
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
    
    // Get trips
    const result = await tripService.getTripsByDriver(driverId, options);
    
    return res.status(200).json(successResponse(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get trips for a vehicle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getTripsByVehicle = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    // Build options
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
    
    // Get trips
    const result = await tripService.getTripsByVehicle(vehicleId, options);
    
    return res.status(200).json(successResponse(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get my trips (for driver)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getMyTrips = async (req, res, next) => {
  try {
    // Get driver ID from user context
    const { driverId } = req.user;
    
    if (!driverId) {
      return res.status(400).json(errorResponse('You are not registered as a driver', 400));
    }
    
    const { page = 1, limit = 10, status } = req.query;
    
    // Build options
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
    
    // Get trips
    const result = await tripService.getTripsByDriver(driverId, options);
    
    return res.status(200).json(successResponse(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Create trip
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createTrip = async (req, res, next) => {
  try {
    // Get creator's user ID
    const userId = req.user._id;
    
    // Create trip
    const trip = await tripService.createTrip(req.body, userId);
    
    return res.status(201).json(successResponse(trip, 'Trip created successfully'));
  } catch (err) {
    if (err.message.includes('scheduling conflict')) {
      return res.status(409).json(errorResponse(err.message, 409));
    }
    
    if (err.message.includes('not found') || err.message.includes('inactive')) {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    next(err);
  }
};

/**
 * Update trip
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Update trip
    const trip = await tripService.updateTrip(id, req.body);
    
    return res.status(200).json(successResponse(trip, 'Trip updated successfully'));
  } catch (err) {
    if (err.message.includes('Trip not found')) {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    if (err.message.includes('scheduling conflict')) {
      return res.status(409).json(errorResponse(err.message, 409));
    }
    
    if (err.message.includes('Cannot update')) {
      return res.status(400).json(errorResponse(err.message, 400));
    }
    
    next(err);
  }
};

/**
 * Update trip status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateTripStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, ...statusData } = req.body;
    
    // Update trip status
    const trip = await tripService.updateTripStatus(id, status, statusData);
    
    return res.status(200).json(successResponse(trip, `Trip status updated to ${status}`));
  } catch (err) {
    if (err.message.includes('Trip not found')) {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    if (err.message.includes('Cannot change trip status')) {
      return res.status(400).json(errorResponse(err.message, 400));
    }
    
    next(err);
  }
};

/**
 * Add checkpoint to trip
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const addCheckpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Add checkpoint
    const trip = await tripService.addCheckpoint(id, req.body);
    
    return res.status(200).json(successResponse(trip, 'Checkpoint added successfully'));
  } catch (err) {
    if (err.message.includes('Trip not found')) {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    if (err.message.includes('Cannot add checkpoints')) {
      return res.status(400).json(errorResponse(err.message, 400));
    }
    
    next(err);
  }
};

/**
 * Update checkpoint status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateCheckpointStatus = async (req, res, next) => {
  try {
    const { tripId, checkpointId } = req.params;
    const { status, notes } = req.body;
    
    // Update checkpoint status
    const trip = await tripService.updateCheckpointStatus(tripId, checkpointId, status, notes);
    
    return res.status(200).json(successResponse(trip, 'Checkpoint status updated successfully'));
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    if (err.message.includes('Cannot update checkpoints')) {
      return res.status(400).json(errorResponse(err.message, 400));
    }
    
    next(err);
  }
};

/**
 * Delete trip
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete trip
    await tripService.deleteTrip(id);
    
    return res.status(200).json(successResponse(null, 'Trip deleted successfully'));
  } catch (err) {
    if (err.message.includes('Trip not found')) {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    if (err.message.includes('Cannot delete')) {
      return res.status(400).json(errorResponse(err.message, 400));
    }
    
    next(err);
  }
};

module.exports = {
  getTrips,
  getTrip,
  getTripsByDriver,
  getTripsByVehicle,
  getMyTrips,
  createTrip,
  updateTrip,
  updateTripStatus,
  addCheckpoint,
  updateCheckpointStatus,
  deleteTrip
}; 