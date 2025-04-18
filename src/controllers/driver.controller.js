const driverService = require('../services/driver.service');
const { successResponse, errorResponse } = require('../common/responses/response.utils');
const tripScheduleService = require('../services/tripSchedule.service');
const catchAsync = require('../utils/catchAsync');

/**
 * Get all drivers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getDrivers = async (req, res, next) => {
  try {
    // Extract query parameters
    const { 
      search 
    } = req.query;
  
    const filters = {};
    if (search) {
      filters.$or = [
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
        { 'user.phone': { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build options
    const options = {
      sort: { name: 1 }
    };
    
    // Get drivers
    const result = await driverService.getDrivers(filters, options);
    
    return res.status(200).json(successResponse(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get driver by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get driver
    const driver = await driverService.getDriverById(id);
    
    if (!driver) {
      return res.status(404).json(errorResponse('Driver not found', 404));
    }
    
    return res.status(200).json(successResponse(driver));
  } catch (err) {
    next(err);
  }
};

/**
 * Get my driver profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get driver by user ID
    const driver = await driverService.getDriverByUserId(userId);
    
    if (!driver) {
      return res.status(404).json(errorResponse('Driver profile not found', 404));
    }
    
    return res.status(200).json(successResponse(driver));
  } catch (err) {
    next(err);
  }
};

/**
 * Create driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createDriver = async (req, res, next) => {
  try {
    // Create driver
    const driver = await driverService.createDriver(req.body);
    
    return res.status(201).json(successResponse(driver, 'Driver created successfully'));
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(409).json(errorResponse(err.message, 409));
    }
    
    if (err.message === 'User not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    next(err);
  }
};

/**
 * Update driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Update driver
    const driver = await driverService.updateDriver(id, req.body);
    
    return res.status(200).json(successResponse(driver, 'Driver updated successfully'));
  } catch (err) {
    if (err.message === 'Driver not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    if (err.message.includes('already registered')) {
      return res.status(409).json(errorResponse(err.message, 409));
    }
    
    next(err);
  }
};

/**
 * Update driver status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateDriverStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Update driver status
    const driver = await driverService.updateDriverStatus(id, status, notes);
    
    return res.status(200).json(successResponse(driver, 'Driver status updated successfully'));
  } catch (err) {
    if (err.message === 'Driver not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    next(err);
  }
};

/**
 * Add document to driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const addDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = req.body;
    
    // Add document
    const driver = await driverService.addDocument(id, document);
    
    return res.status(200).json(successResponse(driver, 'Document added successfully'));
  } catch (err) {
    if (err.message === 'Driver not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    next(err);
  }
};

/**
 * Verify document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyDocument = async (req, res, next) => {
  try {
    const { driverId, documentId } = req.params;
    
    // Verify document
    const driver = await driverService.verifyDocument(driverId, documentId);
    
    return res.status(200).json(successResponse(driver, 'Document verified successfully'));
  } catch (err) {
    if (err.message === 'Driver not found' || err.message === 'Document not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    next(err);
  }
};

/**
 * Delete driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete driver
    await driverService.deleteDriver(id);
    
    return res.status(200).json(successResponse(null, 'Driver deleted successfully'));
  } catch (err) {
    if (err.message === 'Driver not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    next(err);
  }
};

/**
 * Get schedules for the logged-in driver
 * @route GET /api/driver/schedules
 * @access Private - Driver
 */
const getDriverSchedules = catchAsync(async (req, res) => {
  const { date} = req.query;
  
  // Create filter based on driver ID and optional parameters
  const filter = { driverId: req.user._id , status: 'scheduled'};

  
  // Add date filter if provided
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    filter.tripStartTime = { $gte: startDate, $lte: endDate };
  }
  
  // Setup pagination options
  const options = {
    sortBy: { tripStartTime: 1 } // Sort by trip start time ascending
  };
  
  // Call the trip schedule service to get the driver's schedules
  const result = await tripScheduleService.getSchedules(filter, options);
  
  return res.json(result);
});

module.exports = {
  getDrivers,
  getDriver,
  getMyProfile,
  createDriver,
  updateDriver,
  updateDriverStatus,
  addDocument,
  verifyDocument,
  deleteDriver,
  getDriverSchedules
}; 