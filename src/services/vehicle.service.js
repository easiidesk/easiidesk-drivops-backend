const Vehicle = require('../models/vehicle.model');
const User = require('../models/user.model');

/**
 * Get all vehicles
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of vehicles with pagination
 */
const getVehicles = async (filters = {}, options = {}) => {

  
  // Add default filter for non-deleted vehicles
  const queryFilters = {
    ...filters,
    deletedAt: null
  };
  
  const vehicles = await Vehicle.find(queryFilters)
    .populate('assignedDriver', 'name email phone')
    .sort(options.sort)
  
  const total = await Vehicle.countDocuments(queryFilters);
  
  return {
    vehicles,
    pagination: {
      total
    }
  };
};

/**
 * Get vehicle by ID
 * @param {string} id - Vehicle ID
 * @returns {Promise<Object>} Vehicle data
 */
const getVehicleById = async (id) => {
  return await Vehicle.findOne({ _id: id, deletedAt: null })
    .populate('assignedDriver', 'name email phone');
};

/**
 * Create vehicle
 * @param {Object} vehicleData - Vehicle data to create
 * @returns {Promise<Object>} Created vehicle
 */
const createVehicle = async (vehicleData) => {
  // Check if vehicle with the same license plate exists
  const existingVehicle = await Vehicle.findOne({
    licensePlate: vehicleData.licensePlate,
    deletedAt: null
  });
  
  if (existingVehicle) {
    throw new Error('Vehicle with the same license plate already exists');
  }
  
  // Check if driver exists and is valid (if assigned)
  if (vehicleData.assignedDriver) {
    const driver = await User.findOne({ 
      _id: vehicleData.assignedDriver,
      role: 'driver',
      isActive: true,
      deletedAt: null
    });
    
    if (!driver) {
      throw new Error('Invalid driver assignment. Driver not found or not active.');
    }
  }
  
  // Create new vehicle
  const vehicle = new Vehicle(vehicleData);
  await vehicle.save();
  
  return vehicle;
};

/**
 * Update vehicle
 * @param {string} id - Vehicle ID
 * @param {Object} updateData - Vehicle data to update
 * @returns {Promise<Object>} Updated vehicle
 */
const updateVehicle = async (id, updateData) => {
  // Check if vehicle exists
  const vehicle = await Vehicle.findOne({ _id: id, deletedAt: null });
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }
      
  // Check for duplicate license plate
  if (updateData.licensePlate) {
    const query = { 
      _id: { $ne: id },
      deletedAt: null,
      $or: []
    };
    
    if (updateData.licensePlate) {
      query.$or.push({ licensePlate: updateData.licensePlate });
    }
    
    if (query.$or.length > 0) {
      const existingVehicle = await Vehicle.findOne(query);
      if (existingVehicle) {
        throw new Error('License plate already in use');
      }
    }
  }
  
  // Check if driver exists and is valid (if assigned)
  if (updateData.assignedDriver) {
    const driver = await User.findOne({ 
      _id: updateData.assignedDriver,
      role: 'driver',
      isActive: true,
      deletedAt: null
    });
    
    if (!driver) {
      throw new Error('Invalid driver assignment. Driver not found or not active.');
    }
  }
  
  // Update vehicle
  Object.keys(updateData).forEach(key => {
    vehicle[key] = updateData[key];
  });
  
  vehicle.updatedAt = new Date();
  await vehicle.save();
  
  return vehicle;
};

/**
 * Update vehicle status
 * @param {string} id - Vehicle ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated vehicle
 */
const updateVehicleStatus = async (id, status) => {
  // Check if vehicle exists
  const vehicle = await Vehicle.findOne({ _id: id, deletedAt: null });
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }
  
  // Update status
  vehicle.status = status;
  vehicle.updatedAt = new Date();
  
  // If moving to maintenance, set lastMaintenanceDate
  if (status === 'maintenance') {
    vehicle.lastMaintenanceDate = new Date();
  }
  
  await vehicle.save();
  
  return vehicle;
};

/**
 * Assign driver to vehicle
 * @param {string} id - Vehicle ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} Updated vehicle
 */
const assignDriver = async (id, driverId) => {
  // Check if vehicle exists
  const vehicle = await Vehicle.findOne({ _id: id, deletedAt: null });
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }
  
  // Check if driver exists and is valid
  const driver = await User.findOne({ 
    _id: driverId,
    role: 'driver',
    isActive: true,
    deletedAt: null
  });
  
  if (!driver) {
    throw new Error('Invalid driver assignment. Driver not found or not active.');
  }
  
  // Update vehicle with driver
  vehicle.assignedDriver = driverId;
  vehicle.updatedAt = new Date();
  await vehicle.save();
  
  return vehicle;
};

/**
 * Remove driver from vehicle
 * @param {string} id - Vehicle ID
 * @returns {Promise<Object>} Updated vehicle
 */
const removeDriver = async (id) => {
  // Check if vehicle exists
  const vehicle = await Vehicle.findOne({ _id: id, deletedAt: null });
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }
  
  // Remove driver from vehicle
  vehicle.assignedDriver = null;
  vehicle.updatedAt = new Date();
  await vehicle.save();
  
  return vehicle;
};

/**
 * Delete vehicle
 * @param {string} id - Vehicle ID
 * @returns {Promise<Object>} Deleted vehicle
 */
const deleteVehicle = async (id) => {
  // Check if vehicle exists
  const vehicle = await Vehicle.findOne({ _id: id, deletedAt: null });
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }
  
  // Soft delete
  vehicle.isActive = false;
  vehicle.status = 'retired';
  vehicle.deletedAt = new Date();
  vehicle.updatedAt = new Date();
  await vehicle.save();
  
  return vehicle;
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  assignDriver,
  removeDriver,
  deleteVehicle
}; 