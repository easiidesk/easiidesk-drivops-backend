/**
 * Fueling Record Service
 * Business logic for vehicle fueling records
 */
const { FuelingRecord, Vehicle, User } = require('../models');
const ApiError = require('../utils/ApiError');
const {status} = require('http-status');
const { sendNotificationsToRoles } = require('../utils/notifcationHelper');
const { createFuelingRecordNotification, updateFuelingRecordNotification, deleteFuelingRecordNotification } = require('../notificationTemplates/fuelingRecord');
/**
 * Create a fueling record
 * @param {Object} recordData - Fueling record data
 * @returns {Promise<Object>} Created fueling record
 */
const createFuelingRecord = async (recordData, userId) => {
  // Verify vehicle exists
  const vehicle = await Vehicle.findOne({ _id: recordData.vehicleId, isActive: true });
  if (!vehicle) {
    throw new ApiError(status.NOT_FOUND, 'Vehicle not found');
  }
  
  // Create fueling record
  const fuelingRecord = await FuelingRecord.create({
    ...recordData,
    date: recordData.date || new Date()
  });

  let vehicleData = {
    lastFuelingOdometer: recordData.odometer,
    lastFuelingAmount: recordData.amount,
    lastFuelingDate: recordData.date || new Date(),
    updatedAt: new Date()
  };

  // Calculate mileage if we have previous fueling data
  if ((vehicle.lastFuelingOdometer||0) && (vehicle.lastFuelingAmount) && recordData.odometer > (vehicle.lastFuelingOdometer||0)) {
    const mileage = (recordData.odometer - vehicle.lastFuelingOdometer) / vehicle.lastFuelingAmount;

    vehicleData.mileage = mileage;
    
  } 
    // If first fueling or missing data, just update fueling stats
    await Vehicle.updateOne(
      { _id: recordData.vehicleId },
      vehicleData
    );

  const fuelingRecordData = await getFuelingRecordById(fuelingRecord._id);
  //notify all schedulers-admins-super-admins
  sendNotificationsToRoles([ 'admin', 'super-admin'], ['receiveFuelingRecordCreatedNotification'], `${fuelingRecordData.vehicleId.name} fueled for Dh ${fuelingRecordData.amount}`, createFuelingRecordNotification(fuelingRecordData), {
    fuelingRecordId: fuelingRecordData._id.toString()
  },[userId]);
  
  return fuelingRecord;
};

/**
 * Get all fueling records with filtering and pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated fueling records
 */
const getAllFuelingRecords = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sortBy } = options;
  
  // Ensure we only get active records
  const queryFilter = { ...filter, isActive: true };
  
  // Get paginated results
  const fuelingRecords = await FuelingRecord.paginate(queryFilter, {
    sortBy: sortBy || 'fueledAt:desc',
    limit: parseInt(limit, 10),
    page: parseInt(page, 10),
    populate: [
      { path: 'vehicleId', select: 'name licensePlate' },
      { path: 'fueledBy', select: 'name' }
    ]
  });
  
  return fuelingRecords;
};

/**
 * Get fueling records for a specific vehicle
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated fueling records for the vehicle
 */
const getVehicleFuelingRecords = async (vehicleId, options = {}) => {
  // Verify vehicle exists
  const vehicle = await Vehicle.findOne({ _id: vehicleId, isActive: true });
  if (!vehicle) {
    throw new ApiError(status.NOT_FOUND, 'Vehicle not found');
  }
  
  // Get records for this vehicle
  return getAllFuelingRecords({ vehicleId }, options);
};

/**
 * Get fueling records created by a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated fueling records created by the user
 */
const getUserFuelingRecords = async (userId, options = {}) => {
  // Verify user exists
  const user = await User.findOne({ _id: userId, isActive: true });
  if (!user) {
    throw new ApiError(status.NOT_FOUND, 'User not found');
  }
  
  // Get records created by this user
  return getAllFuelingRecords({ fueledBy: userId }, options);
};

/**
 * Get a specific fueling record by ID
 * @param {string} id - Fueling record ID
 * @returns {Promise<Object>} Fueling record
 */
const getFuelingRecordById = async (id) => {
  const record = await FuelingRecord.findOne({ _id: id, isActive: true })
    .populate('vehicleId', 'name')
    .populate('fueledBy', 'name');
  
  if (!record) {
    throw new ApiError(status.NOT_FOUND, 'Fueling record not found');
  }
  
  return record;
};

/**
 * Update a fueling record
 * @param {string} id - Fueling record ID
 * @param {Object} updateData - Data to update
 * @param {Object} user - User making the update (contains id and role)
 * @returns {Promise<Object>} Updated fueling record
 */
const updateFuelingRecord = async (id, updateData, user) => {
  const record = await FuelingRecord.findOne({ _id: id, isActive: true });
  
  if (!record) {
    throw new ApiError(status.NOT_FOUND, 'Fueling record not found');
  }
  
  // Only allow the user who created the record to update it, unless admin
  const isAdmin = ['admin', 'super-admin'].includes(user.role);
  const isCreator = record.createdBy?.toString() === user.id;
  
  if (!isAdmin && !isCreator) {
    throw new ApiError(status.FORBIDDEN, 'You are not authorized to update this record');
  }
  
  // If odometer is being updated, check vehicle
  if (updateData.odometer) {
    const vehicle = await Vehicle.findOne({ _id: record.vehicleId });
    
    // Update vehicle's odometer if the new reading is higher
    if (updateData.odometer > (vehicle.mileage || 0)) {
      await Vehicle.updateOne(
        { _id: record.vehicleId },
        { 
          mileage: updateData.odometer,
          updatedAt: new Date() 
        }
      );
    }
  }
  
  // Update record
  Object.assign(record, updateData);
  await record.save();

  const fuelingRecordData = await getFuelingRecordById(id);
  //notify all schedulers-admins-super-admins
  sendNotificationsToRoles([ 'admin', 'super-admin'], ['receiveFuelingRecordUpdatedNotification'], `${fuelingRecordData.vehicle.name} fueled for Dh ${fuelingRecordData.recordData.amount}`, updateFuelingRecordNotification(fuelingRecordData), {
    fuelingRecordId: fuelingRecordData._id.toString()
  },[user.id]);
  
  return record;
};

/**
 * Delete a fueling record (soft delete)
 * @param {string} id - Fueling record ID
 * @param {string} userId - ID of user making the deletion
 * @returns {Promise<Object>} Deleted fueling record
 */
const deleteFuelingRecord = async (id, userId) => {
  const record = await FuelingRecord.findOne({ _id: id, isActive: true });
  
  if (!record) {
    throw new ApiError(status.NOT_FOUND, 'Fueling record not found');
  }
  
  // Soft delete
  record.isActive = false;
  record.deletedAt = new Date();
  record.deletedBy = userId;
  await record.save();

  const fuelingRecordData = await getFuelingRecordById(id);
  //notify all schedulers-admins-super-admins
  sendNotificationsToRoles([ 'admin', 'super-admin'], ['receiveFuelingRecordDeletedNotification'], `${fuelingRecordData.vehicle.name} fueled for Dh ${fuelingRecordData.recordData.amount}`, deleteFuelingRecordNotification(fuelingRecordData), {
    fuelingRecordId: fuelingRecordData._id.toString()
  },[userId]);
  
  return record;
};

/**
 * Get fueling history for a driver with filtering options
 * @param {string} driverId - Driver ID
 * @param {Object} filter - Filter criteria (vehicleId, dateRange)
 * @param {Object} options - Query options (pagination, sorting)
 * @returns {Promise<Object>} Paginated fueling records
 */
const getDriverFuelingHistory = async (driverId, filter = {}, options = {}) => {
  // Verify driver exists
  const driver = await User.findOne({ 
    _id: driverId,
    role: 'driver',
    isActive: true,
    deletedAt: null
  });
  
  if (!driver) {
    throw new ApiError(status.NOT_FOUND, 'Driver not found');
  }
  
  // Build filter - always include the driver ID and active status
  const queryFilter = { 
    fueledBy: driverId,
    isActive: true,
    ...filter 
  };
  
  // Get paginated results with populated fields
  const fuelingRecords = await FuelingRecord.paginate(queryFilter, {
    sortBy: options.sortBy || 'fueledAt:desc',
    limit: parseInt(options.limit || 10, 10),
    page: parseInt(options.page || 1, 10),
    populate: [
      { path: 'vehicleId', select: 'name licensePlate' }
    ]
  });
  
  return {
    data: fuelingRecords.results,
    pagination: {
      page: fuelingRecords.page,
      limit: fuelingRecords.limit,
      totalResults: fuelingRecords.totalResults,
      totalPages: fuelingRecords.totalPages
    }
  };
};

module.exports = {
  createFuelingRecord,
  getAllFuelingRecords,
  getVehicleFuelingRecords,
  getUserFuelingRecords,
  getFuelingRecordById,
  updateFuelingRecord,
  deleteFuelingRecord,
  getDriverFuelingHistory
}; 