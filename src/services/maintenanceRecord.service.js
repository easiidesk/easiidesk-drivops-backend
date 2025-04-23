/**
 * Maintenance Record Service
 * Business logic for vehicle maintenance records
 */
const { MaintenanceRecord, Vehicle, User } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

/**
 * Create a maintenance record
 * @param {Object} recordData - Maintenance record data
 * @returns {Promise<Object>} Created maintenance record
 */
const createMaintenanceRecord = async (recordData) => {
  // Verify vehicle exists
  const vehicle = await Vehicle.findOne({ _id: recordData.vehicleId, isActive: true });
  if (!vehicle) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vehicle not found');
  }

  // Verify the requesting user exists
  const requestingUser = await User.findOne({ _id: recordData.requestedBy, isActive: true });
  if (!requestingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Requesting user not found');
  }

  // Create maintenance record
  recordData.requestedAt = new Date();
  
  const maintenanceRecord = await MaintenanceRecord.create(recordData);
  
  // Update vehicle's odometer if the new reading is higher
  if (recordData.odometer > vehicle.mileage) {
    await Vehicle.updateOne(
      { _id: recordData.vehicleId },
      { mileage: recordData.odometer, updatedAt: new Date() }
    );
  }
  
  return maintenanceRecord;
};

/**
 * Get all maintenance records with filtering and pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated maintenance records
 */
const getAllMaintenanceRecords = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sortBy } = options;
  
  // Ensure we only get active records
  const queryFilter = { ...filter, isActive: true };
  
  // Get paginated results
  const maintenanceRecords = await MaintenanceRecord.paginate(queryFilter, {
    sortBy: sortBy || 'createdAt:desc',
    limit: parseInt(limit, 10),
    page: parseInt(page, 10),
    populate: [
      { path: 'vehicleId', select: 'name licensePlate' },
      { path: 'requestedBy', select: 'name' },
      { path: 'approvedBy', select: 'name' }
    ]
  });
  
  return maintenanceRecords;
};

/**
 * Get maintenance records for a specific vehicle
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated maintenance records for the vehicle
 */
const getVehicleMaintenanceRecords = async (vehicleId, options = {}) => {
  // Verify vehicle exists
  const vehicle = await Vehicle.findOne({ _id: vehicleId, isActive: true });
  if (!vehicle) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vehicle not found');
  }
  
  // Get records for this vehicle
  return getAllMaintenanceRecords({ vehicleId }, options);
};

/**
 * Get maintenance records requested by a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated maintenance records requested by the user
 */
const getUserMaintenanceRecords = async (userId, options = {}) => {
  // Verify user exists
  const user = await User.findOne({ _id: userId, isActive: true });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  
  // Get records requested by this user
  return getAllMaintenanceRecords({ requestedBy: userId }, options);
};

/**
 * Get a specific maintenance record by ID
 * @param {string} id - Maintenance record ID
 * @returns {Promise<Object>} Maintenance record
 */
const getMaintenanceRecordById = async (id) => {
  const record = await MaintenanceRecord.findOne({ _id: id, isActive: true })
    .populate('vehicleId', 'name licensePlate')
    .populate('requestedBy', 'name')
    .populate('approvedBy', 'name');
  
  if (!record) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Maintenance record not found');
  }
  
  return record;
};

/**
 * Update a maintenance record
 * @param {string} id - Maintenance record ID
 * @param {Object} updateData - Data to update
 * @param {Object} user - User making the update (contains id and role)
 * @returns {Promise<Object>} Updated maintenance record
 */
const updateMaintenanceRecord = async (id, updateData, user) => {
  const record = await MaintenanceRecord.findOne({ _id: id, isActive: true });
  
  if (!record) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Maintenance record not found');
  }
  
  // Only allow the user who created the record to update it, unless admin
  const isAdmin = ['admin', 'super-admin'].includes(user.role);
  const isRequester = record.requestedBy.toString() === user.id;
  
  if (!isAdmin && !isRequester) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this record');
  }
  
  // If odometer is being updated, check vehicle
  if (updateData.odometer) {
    const vehicle = await Vehicle.findOne({ _id: record.vehicleId });
    
    // Update vehicle's odometer if the new reading is higher
    if (updateData.odometer > vehicle.mileage) {
      await Vehicle.updateOne(
        { _id: record.vehicleId },
        { mileage: updateData.odometer, updatedAt: new Date() }
      );
    }
  }
  
  // Update record
  Object.assign(record, updateData);
  await record.save();
  
  return record;
};

/**
 * Delete a maintenance record (soft delete)
 * @param {string} id - Maintenance record ID
 * @param {Object} user - User making the deletion (contains id and role)
 * @returns {Promise<Object>} Deleted maintenance record
 */
const deleteMaintenanceRecord = async (id, user) => {
  const record = await MaintenanceRecord.findOne({ _id: id, isActive: true });
  
  if (!record) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Maintenance record not found');
  }
  
  // Only allow the user who created the record to delete it, unless admin
  const isAdmin = ['admin', 'super-admin'].includes(user.role);
  const isRequester = record.requestedBy.toString() === user.id;
  
  if (!isAdmin && !isRequester) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this record');
  }
  
  // Soft delete
  record.isActive = false;
  record.deletedAt = new Date();
  record.deletedBy = user.id;
  await record.save();
  
  return record;
};

module.exports = {
  createMaintenanceRecord,
  getAllMaintenanceRecords,
  getVehicleMaintenanceRecords,
  getUserMaintenanceRecords,
  getMaintenanceRecordById,
  updateMaintenanceRecord,
  deleteMaintenanceRecord
}; 