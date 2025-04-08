const Trip = require('../models/trip.model');
const Driver = require('../models/driver.model');
const Vehicle = require('../models/vehicle.model');
const User = require('../models/user.model');

/**
 * Get all trips with optional filters and pagination
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options (pagination, sorting)
 * @returns {Promise<Object>} Trips with pagination info
 */
const getTrips = async (filters = {}, options = {}) => {
  const defaultOptions = {
    page: 1,
    limit: 10,
    sort: { scheduledStartTime: -1 }
  };
  
  const queryOptions = { ...defaultOptions, ...options };
  const skip = (queryOptions.page - 1) * queryOptions.limit;
  
  // Add default filter for active and non-deleted trips
  const queryFilters = {
    ...filters,
    isActive: true,
    deletedAt: null
  };
  
  // Build the query
  const tripQuery = Trip.find(queryFilters)
    .populate('driver', '_id licenseNumber')
    .populate({
      path: 'driver',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    })
    .populate('vehicle', 'name licensePlate')
    .populate('createdBy', 'name email')
    .sort(queryOptions.sort)
    .skip(skip)
    .limit(queryOptions.limit);
  
  // Execute the query
  const trips = await tripQuery;
  const total = await Trip.countDocuments(queryFilters);
  
  return {
    trips,
    pagination: {
      total,
      page: queryOptions.page,
      limit: queryOptions.limit,
      pages: Math.ceil(total / queryOptions.limit)
    }
  };
};

/**
 * Get trip by ID
 * @param {string} id - Trip ID
 * @returns {Promise<Object>} Trip details
 */
const getTripById = async (id) => {
  return await Trip.findOne({ _id: id, isActive: true, deletedAt: null })
    .populate('driver', '_id licenseNumber')
    .populate({
      path: 'driver',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    })
    .populate('vehicle', 'name licensePlate')
    .populate('createdBy', 'name email');
};

/**
 * Get trips for a specific driver
 * @param {string} driverId - Driver ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of trips
 */
const getTripsByDriver = async (driverId, options = {}) => {
  const defaultOptions = {
    page: 1,
    limit: 10,
    sort: { scheduledStartTime: -1 }
  };
  
  const queryOptions = { ...defaultOptions, ...options };
  const skip = (queryOptions.page - 1) * queryOptions.limit;
  
  // Build the query
  const trips = await Trip.find({
    driver: driverId, 
    isActive: true,
    deletedAt: null
  })
    .populate('vehicle', 'name licensePlate')
    .populate('createdBy', 'name email')
    .sort(queryOptions.sort)
    .skip(skip)
    .limit(queryOptions.limit);
  
  const total = await Trip.countDocuments({
    driver: driverId, 
    isActive: true,
    deletedAt: null
  });
  
  return {
    trips,
    pagination: {
      total,
      page: queryOptions.page,
      limit: queryOptions.limit,
      pages: Math.ceil(total / queryOptions.limit)
    }
  };
};

/**
 * Get trips for a specific vehicle
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of trips
 */
const getTripsByVehicle = async (vehicleId, options = {}) => {
  const defaultOptions = {
    page: 1,
    limit: 10,
    sort: { scheduledStartTime: -1 }
  };
  
  const queryOptions = { ...defaultOptions, ...options };
  const skip = (queryOptions.page - 1) * queryOptions.limit;
  
  // Build the query
  const trips = await Trip.find({
    vehicle: vehicleId, 
    isActive: true,
    deletedAt: null
  })
    .populate('driver', '_id licenseNumber')
    .populate({
      path: 'driver',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    })
    .populate('createdBy', 'name email')
    .sort(queryOptions.sort)
    .skip(skip)
    .limit(queryOptions.limit);
  
  const total = await Trip.countDocuments({
    vehicle: vehicleId, 
    isActive: true,
    deletedAt: null
  });
  
  return {
    trips,
    pagination: {
      total,
      page: queryOptions.page,
      limit: queryOptions.limit,
      pages: Math.ceil(total / queryOptions.limit)
    }
  };
};

/**
 * Create new trip
 * @param {Object} tripData - Trip data
 * @param {string} userId - User ID of creator
 * @returns {Promise<Object>} Created trip
 */
const createTrip = async (tripData, userId) => {
  // Check if driver exists and is active
  const driver = await Driver.findOne({ 
    _id: tripData.driver, 
    isActive: true, 
    deletedAt: null 
  });
  
  if (!driver) {
    throw new Error('Driver not found or inactive');
  }
  
  if (driver.status !== 'active') {
    throw new Error(`Driver is currently ${driver.status}`);
  }
  
  // Check if vehicle exists and is active
  const vehicle = await Vehicle.findOne({ 
    _id: tripData.vehicle, 
    isActive: true, 
    deletedAt: null 
  });
  
  if (!vehicle) {
    throw new Error('Vehicle not found or inactive');
  }
  
  if (vehicle.status !== 'active') {
    throw new Error(`Vehicle is currently ${vehicle.status}`);
  }
  
  // Check if user exists
  const user = await User.findOne({ 
    _id: userId, 
    isActive: true, 
    deletedAt: null 
  });
  
  if (!user) {
    throw new Error('User not found or inactive');
  }
  
  // Check for scheduling conflicts for driver
  const driverConflict = await Trip.findOne({
    driver: tripData.driver,
    status: { $in: ['scheduled', 'in_progress'] },
    $or: [
      {
        scheduledStartTime: { $lte: tripData.scheduledStartTime },
        scheduledEndTime: { $gte: tripData.scheduledStartTime }
      },
      {
        scheduledStartTime: { $lte: tripData.scheduledEndTime },
        scheduledEndTime: { $gte: tripData.scheduledEndTime }
      },
      {
        scheduledStartTime: { $gte: tripData.scheduledStartTime },
        scheduledEndTime: { $lte: tripData.scheduledEndTime }
      }
    ],
    isActive: true,
    deletedAt: null
  });
  
  if (driverConflict) {
    throw new Error('Driver has a scheduling conflict with another trip');
  }
  
  // Check for scheduling conflicts for vehicle
  const vehicleConflict = await Trip.findOne({
    vehicle: tripData.vehicle,
    status: { $in: ['scheduled', 'in_progress'] },
    $or: [
      {
        scheduledStartTime: { $lte: tripData.scheduledStartTime },
        scheduledEndTime: { $gte: tripData.scheduledStartTime }
      },
      {
        scheduledStartTime: { $lte: tripData.scheduledEndTime },
        scheduledEndTime: { $gte: tripData.scheduledEndTime }
      },
      {
        scheduledStartTime: { $gte: tripData.scheduledStartTime },
        scheduledEndTime: { $lte: tripData.scheduledEndTime }
      }
    ],
    isActive: true,
    deletedAt: null
  });
  
  if (vehicleConflict) {
    throw new Error('Vehicle has a scheduling conflict with another trip');
  }
  
  // Create new trip
  const trip = new Trip({
    ...tripData,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await trip.save();
  
  return trip;
};

/**
 * Update trip
 * @param {string} id - Trip ID
 * @param {Object} updateData - Trip data to update
 * @returns {Promise<Object>} Updated trip
 */
const updateTrip = async (id, updateData) => {
  // Check if trip exists
  const trip = await Trip.findOne({ 
    _id: id, 
    isActive: true, 
    deletedAt: null 
  });
  
  if (!trip) {
    throw new Error('Trip not found');
  }
  
  // Cannot update trips that are completed or cancelled
  if (trip.status === 'completed' || trip.status === 'cancelled') {
    throw new Error(`Cannot update a trip that is ${trip.status}`);
  }
  
  // Check scheduling conflicts if dates are being updated
  if (
    (updateData.scheduledStartTime && updateData.scheduledStartTime !== trip.scheduledStartTime) ||
    (updateData.scheduledEndTime && updateData.scheduledEndTime !== trip.scheduledEndTime) ||
    (updateData.driver && updateData.driver !== trip.driver.toString()) ||
    (updateData.vehicle && updateData.vehicle !== trip.vehicle.toString())
  ) {
    const driver = updateData.driver || trip.driver;
    const vehicle = updateData.vehicle || trip.vehicle;
    const startTime = updateData.scheduledStartTime || trip.scheduledStartTime;
    const endTime = updateData.scheduledEndTime || trip.scheduledEndTime;
    
    // Check for driver conflicts
    const driverConflict = await Trip.findOne({
      _id: { $ne: id },
      driver,
      status: { $in: ['scheduled', 'in_progress'] },
      $or: [
        {
          scheduledStartTime: { $lte: startTime },
          scheduledEndTime: { $gte: startTime }
        },
        {
          scheduledStartTime: { $lte: endTime },
          scheduledEndTime: { $gte: endTime }
        },
        {
          scheduledStartTime: { $gte: startTime },
          scheduledEndTime: { $lte: endTime }
        }
      ],
      isActive: true,
      deletedAt: null
    });
    
    if (driverConflict) {
      throw new Error('Driver has a scheduling conflict with another trip');
    }
    
    // Check for vehicle conflicts
    const vehicleConflict = await Trip.findOne({
      _id: { $ne: id },
      vehicle,
      status: { $in: ['scheduled', 'in_progress'] },
      $or: [
        {
          scheduledStartTime: { $lte: startTime },
          scheduledEndTime: { $gte: startTime }
        },
        {
          scheduledStartTime: { $lte: endTime },
          scheduledEndTime: { $gte: endTime }
        },
        {
          scheduledStartTime: { $gte: startTime },
          scheduledEndTime: { $lte: endTime }
        }
      ],
      isActive: true,
      deletedAt: null
    });
    
    if (vehicleConflict) {
      throw new Error('Vehicle has a scheduling conflict with another trip');
    }
    
    // If driver is changed, check if new driver exists and is active
    if (updateData.driver && updateData.driver !== trip.driver.toString()) {
      const driver = await Driver.findOne({ 
        _id: updateData.driver, 
        isActive: true, 
        deletedAt: null 
      });
      
      if (!driver) {
        throw new Error('Driver not found or inactive');
      }
      
      if (driver.status !== 'active') {
        throw new Error(`Driver is currently ${driver.status}`);
      }
    }
    
    // If vehicle is changed, check if new vehicle exists and is active
    if (updateData.vehicle && updateData.vehicle !== trip.vehicle.toString()) {
      const vehicle = await Vehicle.findOne({ 
        _id: updateData.vehicle, 
        isActive: true, 
        deletedAt: null 
      });
      
      if (!vehicle) {
        throw new Error('Vehicle not found or inactive');
      }
      
      if (vehicle.status !== 'active') {
        throw new Error(`Vehicle is currently ${vehicle.status}`);
      }
    }
  }
  
  // Update trip
  Object.keys(updateData).forEach(key => {
    trip[key] = updateData[key];
  });
  
  trip.updatedAt = new Date();
  await trip.save();
  
  return trip;
};

/**
 * Update trip status
 * @param {string} id - Trip ID
 * @param {string} status - New status
 * @param {Object} statusData - Additional status data
 * @returns {Promise<Object>} Updated trip
 */
const updateTripStatus = async (id, status, statusData = {}) => {
  // Check if trip exists
  const trip = await Trip.findOne({ 
    _id: id, 
    isActive: true, 
    deletedAt: null 
  });
  
  if (!trip) {
    throw new Error('Trip not found');
  }
  
  // Validate status transitions
  const validTransitions = {
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };
  
  if (!validTransitions[trip.status].includes(status)) {
    throw new Error(`Cannot change trip status from ${trip.status} to ${status}`);
  }
  
  // Update status
  trip.status = status;
  
  // Update status-specific fields
  if (status === 'in_progress') {
    trip.actualStartTime = new Date();
  } else if (status === 'completed') {
    trip.actualEndTime = new Date();
    
    // Update additional data if provided
    if (statusData.distance) trip.distance = statusData.distance;
    if (statusData.duration) trip.duration = statusData.duration;
    if (statusData.fuelConsumption) trip.fuelConsumption = statusData.fuelConsumption;
    if (statusData.maintenanceRequired !== undefined) {
      trip.maintenanceRequired = statusData.maintenanceRequired;
      if (statusData.maintenanceRequired && statusData.maintenanceNotes) {
        trip.maintenanceNotes = statusData.maintenanceNotes;
      }
    }
    
    // Update driver's total trips count
    await Driver.findByIdAndUpdate(
      trip.driver,
      { $inc: { totalTrips: 1 } }
    );
  }
  
  trip.updatedAt = new Date();
  await trip.save();
  
  // If trip is cancelled or completed, driver available again
  if (status === 'cancelled' || status === 'completed') {
    await Driver.findByIdAndUpdate(
      trip.driver,
      { isAvailable: true }
    );
  } else if (status === 'in_progress') {
    // If trip is in progress, mark driver as unavailable
    await Driver.findByIdAndUpdate(
      trip.driver,
      { isAvailable: false }
    );
  }
  
  return trip;
};

/**
 * Add checkpoint to trip
 * @param {string} id - Trip ID
 * @param {Object} checkpoint - Checkpoint data
 * @returns {Promise<Object>} Updated trip
 */
const addCheckpoint = async (id, checkpoint) => {
  // Check if trip exists
  const trip = await Trip.findOne({ 
    _id: id, 
    isActive: true, 
    deletedAt: null 
  });
  
  if (!trip) {
    throw new Error('Trip not found');
  }
  
  // Can only add checkpoints to trips that are scheduled or in progress
  if (trip.status !== 'scheduled' && trip.status !== 'in_progress') {
    throw new Error(`Cannot add checkpoints to a trip that is ${trip.status}`);
  }
  
  // Add checkpoint
  trip.checkpoints.push(checkpoint);
  trip.updatedAt = new Date();
  await trip.save();
  
  return trip;
};

/**
 * Update checkpoint status
 * @param {string} tripId - Trip ID
 * @param {string} checkpointId - Checkpoint ID
 * @param {string} status - New status
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} Updated trip
 */
const updateCheckpointStatus = async (tripId, checkpointId, status, notes = '') => {
  // Check if trip exists
  const trip = await Trip.findOne({ 
    _id: tripId, 
    isActive: true, 
    deletedAt: null 
  });
  
  if (!trip) {
    throw new Error('Trip not found');
  }
  
  // Can only update checkpoints for trips that are in progress
  if (trip.status !== 'in_progress') {
    throw new Error('Cannot update checkpoints for a trip that is not in progress');
  }
  
  // Find the checkpoint
  const checkpoint = trip.checkpoints.id(checkpointId);
  if (!checkpoint) {
    throw new Error('Checkpoint not found');
  }
  
  // Update checkpoint
  checkpoint.status = status;
  if (notes) {
    checkpoint.notes = notes;
  }
  checkpoint.timestamp = new Date();
  
  trip.updatedAt = new Date();
  await trip.save();
  
  return trip;
};

/**
 * Delete trip (soft delete)
 * @param {string} id - Trip ID
 * @returns {Promise<Object>} Deleted trip
 */
const deleteTrip = async (id) => {
  // Check if trip exists
  const trip = await Trip.findOne({ 
    _id: id, 
    isActive: true, 
    deletedAt: null 
  });
  
  if (!trip) {
    throw new Error('Trip not found');
  }
  
  // Cannot delete trips that are in progress
  if (trip.status === 'in_progress') {
    throw new Error('Cannot delete a trip that is in progress');
  }
  
  // Soft delete
  trip.isActive = false;
  trip.deletedAt = new Date();
  trip.updatedAt = new Date();
  await trip.save();
  
  return trip;
};

module.exports = {
  getTrips,
  getTripById,
  getTripsByDriver,
  getTripsByVehicle,
  createTrip,
  updateTrip,
  updateTripStatus,
  addCheckpoint,
  updateCheckpointStatus,
  deleteTrip
}; 