const vehicleService = require('../services/vehicle.service');
const { successResponse, errorResponse } = require('../common/responses/response.utils');

/**
 * Get all vehicles
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getVehicles = async (req, res, next) => {
  try {
    // Extract query parameters
    const { page = 1, limit = 10, status, type, search } = req.query;
    
    // Build filters
    const filters = {};
    if (status) {
      filters.status = status;
    }
    
    if (type) {
      filters.type = type;
    }
    
    if (search) {
      filters.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { licensePlate: { $regex: search, $options: 'i' } },
        { vin: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build options
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 }
    };
    
    // Get vehicles
    const result = await vehicleService.getVehicles(filters, options);
    
    return res.status(200).json(successResponse(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get vehicle by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get vehicle
    const vehicle = await vehicleService.getVehicleById(id);
    
    if (!vehicle) {
      return res.status(404).json(errorResponse('Vehicle not found', 404));
    }
    
    return res.status(200).json(successResponse(vehicle));
  } catch (err) {
    next(err);
  }
};

/**
 * Create vehicle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createVehicle = async (req, res, next) => {
  try {
    // Create vehicle
    const vehicle = await vehicleService.createVehicle(req.body);
    
    return res.status(201).json(successResponse(vehicle, 'Vehicle created successfully'));
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(409).json(errorResponse(err.message, 409));
    }
    
    if (err.message.includes('Invalid driver assignment')) {
      return res.status(400).json(errorResponse(err.message, 400));
    }
    
    next(err);
  }
};

/**
 * Update vehicle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Update vehicle
    const vehicle = await vehicleService.updateVehicle(id, req.body);
    
    return res.status(200).json(successResponse(vehicle, 'Vehicle updated successfully'));
  } catch (err) {
    if (err.message === 'Vehicle not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    if (err.message.includes('already in use')) {
      return res.status(409).json(errorResponse(err.message, 409));
    }
    
    if (err.message.includes('Invalid driver assignment')) {
      return res.status(400).json(errorResponse(err.message, 400));
    }
    
    next(err);
  }
};

/**
 * Update vehicle status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateVehicleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Update vehicle status
    const vehicle = await vehicleService.updateVehicleStatus(id, status);
    
    return res.status(200).json(successResponse(vehicle, 'Vehicle status updated successfully'));
  } catch (err) {
    if (err.message === 'Vehicle not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    next(err);
  }
};

/**
 * Assign driver to vehicle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const assignDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    
    // Assign driver to vehicle
    const vehicle = await vehicleService.assignDriver(id, driverId);
    
    return res.status(200).json(successResponse(vehicle, 'Driver assigned to vehicle successfully'));
  } catch (err) {
    if (err.message === 'Vehicle not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    if (err.message.includes('Invalid driver assignment')) {
      return res.status(400).json(errorResponse(err.message, 400));
    }
    
    next(err);
  }
};

/**
 * Remove driver from vehicle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const removeDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Remove driver from vehicle
    const vehicle = await vehicleService.removeDriver(id);
    
    return res.status(200).json(successResponse(vehicle, 'Driver removed from vehicle successfully'));
  } catch (err) {
    if (err.message === 'Vehicle not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    next(err);
  }
};

/**
 * Delete vehicle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete vehicle
    await vehicleService.deleteVehicle(id);
    
    return res.status(200).json(successResponse(null, 'Vehicle deleted successfully'));
  } catch (err) {
    if (err.message === 'Vehicle not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    next(err);
  }
};

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  assignDriver,
  removeDriver,
  deleteVehicle
}; 