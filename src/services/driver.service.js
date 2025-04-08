const Driver = require('../models/driver.model');
const Vehicle = require('../models/vehicle.model');
const User = require('../models/user.model');

/**
 * Get all drivers with optional filters and pagination
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options (pagination, sorting)
 * @returns {Promise<Object>} Drivers with pagination info
 */
const getDrivers = async (filters = {}, options = {}) => {
  const defaultOptions = {
    page: 1,
    limit: 10,
    sort: { createdAt: -1 }
  };
  
  const queryOptions = { ...defaultOptions, ...options };
  const skip = (queryOptions.page - 1) * queryOptions.limit;
  
  // Add default filter for active and non-deleted drivers
  const queryFilters = {
    ...filters,
    isActive: true,
    deletedAt: null
  };
  
  // Build the query
  const driverQuery = Driver.find(queryFilters)
    .populate('user', 'name email phone role')
    .populate('vehicle', 'make model licensePlate')
    .sort(queryOptions.sort)
    .skip(skip)
    .limit(queryOptions.limit);
  
  // Execute the query
  const drivers = await driverQuery;
  const total = await Driver.countDocuments(queryFilters);
  
  return {
    drivers,
    pagination: {
      total,
      page: queryOptions.page,
      limit: queryOptions.limit,
      pages: Math.ceil(total / queryOptions.limit)
    }
  };
};

/**
 * Get driver by ID
 * @param {string} id - Driver ID
 * @returns {Promise<Object>} Driver object
 */
const getDriverById = async (id) => {
  return await Driver.findOne({ _id: id, isActive: true, deletedAt: null })
    .populate('user', 'name email phone role')
    .populate('vehicle', 'make model licensePlate type year color');
};

/**
 * Get driver by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Driver object
 */
const getDriverByUserId = async (userId) => {
  return await Driver.findOne({ user: userId, isActive: true, deletedAt: null })
    .populate('user', 'name email phone role')
    .populate('vehicle', 'make model licensePlate type year color');
};

/**
 * Create new driver
 * @param {Object} driverData - Driver data
 * @returns {Promise<Object>} Created driver
 */
const createDriver = async (driverData) => {
  // Check if user exists
  const user = await User.findById(driverData.user);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if driver already exists for this user
  const existingDriver = await Driver.findOne({ 
    user: driverData.user,
    deletedAt: null
  });

  if (existingDriver) {
    throw new Error('Driver profile already exists for this user');
  }

  // Check if license number is already in use
  const licenseCheck = await Driver.findOne({ 
    licenseNumber: driverData.licenseNumber,
    deletedAt: null
  });

  if (licenseCheck) {
    throw new Error('License number is already registered with another driver');
  }

  // Create new driver
  const driver = new Driver(driverData);
  await driver.save();

  // If vehicle is assigned, update vehicle's driver
  if (driverData.vehicle) {
    await Vehicle.findByIdAndUpdate(
      driverData.vehicle, 
      { driver: driver._id, updatedAt: new Date() }
    );
  }

  // Update user's role if not already a driver
  if (user.role !== 'driver') {
    user.role = 'driver';
    user.updatedAt = new Date();
    await user.save();
  }

  return driver;
};

/**
 * Update driver
 * @param {string} id - Driver ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated driver
 */
const updateDriver = async (id, updateData) => {
  // Check if driver exists
  const driver = await Driver.findOne({ _id: id, isActive: true, deletedAt: null });
  if (!driver) {
    throw new Error('Driver not found');
  }

  // Check if license number is unique if being updated
  if (updateData.licenseNumber && updateData.licenseNumber !== driver.licenseNumber) {
    const licenseCheck = await Driver.findOne({ 
      licenseNumber: updateData.licenseNumber,
      _id: { $ne: id },
      deletedAt: null
    });

    if (licenseCheck) {
      throw new Error('License number is already registered with another driver');
    }
  }

  // Handle vehicle assignment changes
  if (updateData.vehicle !== undefined && updateData.vehicle !== driver.vehicle) {
    // If previous vehicle exists, remove driver assignment
    if (driver.vehicle) {
      await Vehicle.findByIdAndUpdate(
        driver.vehicle,
        { driver: null, updatedAt: new Date() }
      );
    }

    // If new vehicle is assigned, update it
    if (updateData.vehicle) {
      await Vehicle.findByIdAndUpdate(
        updateData.vehicle,
        { driver: id, updatedAt: new Date() }
      );
    }
  }

  // Update driver
  Object.keys(updateData).forEach(key => {
    driver[key] = updateData[key];
  });

  driver.updatedAt = new Date();
  await driver.save();

  return driver;
};

/**
 * Update driver status
 * @param {string} id - Driver ID
 * @param {string} status - New status
 * @param {string} notes - Status change notes
 * @returns {Promise<Object>} Updated driver
 */
const updateDriverStatus = async (id, status, notes = '') => {
  // Check if driver exists
  const driver = await Driver.findOne({ _id: id, isActive: true, deletedAt: null });
  if (!driver) {
    throw new Error('Driver not found');
  }

  // Update status
  driver.status = status;
  
  // Add notes if provided
  if (notes) {
    driver.notes = notes;
  }
  
  driver.updatedAt = new Date();
  await driver.save();

  return driver;
};

/**
 * Add document to driver
 * @param {string} id - Driver ID
 * @param {Object} document - Document data
 * @returns {Promise<Object>} Updated driver
 */
const addDocument = async (id, document) => {
  // Check if driver exists
  const driver = await Driver.findOne({ _id: id, isActive: true, deletedAt: null });
  if (!driver) {
    throw new Error('Driver not found');
  }

  // Add document
  driver.documents.push({
    ...document,
    uploadedAt: new Date()
  });
  
  driver.updatedAt = new Date();
  await driver.save();

  return driver;
};

/**
 * Verify document
 * @param {string} driverId - Driver ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Updated driver
 */
const verifyDocument = async (driverId, documentId) => {
  // Check if driver exists
  const driver = await Driver.findOne({ _id: driverId, isActive: true, deletedAt: null });
  if (!driver) {
    throw new Error('Driver not found');
  }

  // Find document
  const document = driver.documents.id(documentId);
  if (!document) {
    throw new Error('Document not found');
  }

  // Update document
  document.verified = true;
  driver.updatedAt = new Date();
  await driver.save();

  return driver;
};

/**
 * Delete driver (soft delete)
 * @param {string} id - Driver ID
 * @returns {Promise<Object>} Deleted driver
 */
const deleteDriver = async (id) => {
  // Check if driver exists
  const driver = await Driver.findOne({ _id: id, isActive: true, deletedAt: null });
  if (!driver) {
    throw new Error('Driver not found');
  }

  // If driver has vehicle, update vehicle's driver reference
  if (driver.vehicle) {
    await Vehicle.findByIdAndUpdate(
      driver.vehicle,
      { driver: null, updatedAt: new Date() }
    );
  }

  // Soft delete
  driver.isActive = false;
  driver.deletedAt = new Date();
  driver.updatedAt = new Date();
  await driver.save();

  return driver;
};

module.exports = {
  getDrivers,
  getDriverById,
  getDriverByUserId,
  createDriver,
  updateDriver,
  updateDriverStatus,
  addDocument,
  verifyDocument,
  deleteDriver
}; 