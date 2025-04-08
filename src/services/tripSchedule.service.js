const httpStatus = require('http-status');
const { TripSchedule } = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');

/**
 * Get all trip schedules with pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getSchedules = async (filter = {}, options = {}) => {
  const pagination = getPagination(options);
  
  // Default to active and non-deleted schedules
  const defaultFilter = { isActive: true, deletedAt: null };
  const mergedFilter = { ...defaultFilter, ...filter };
  
  return TripSchedule.paginate(mergedFilter, {
    ...pagination,
    populate: [
      { path: 'driverId', select: 'name email phone' },
      { path: 'vehicleId', select: 'name licensePlate' },
      { path: 'destinations.requestId', select: 'destination purpose dateTime noOfPeople' },
    ],
    sort: options.sortBy ? options.sortBy : { createdAt: -1 }
  });
};

/**
 * Get trip schedule by id
 * @param {ObjectId} id
 * @returns {Promise<TripSchedule>}
 */
const getScheduleById = async (id) => {
  const schedule = await TripSchedule.findOne({ _id: id, isActive: true, deletedAt: null })
    .populate('driverId', 'name email phone')
    .populate('vehicleId', 'name licensePlate year')
    .populate('destinations.requestId', 'destination purpose dateTime noOfPeople');
  
  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trip schedule not found');
  }
  
  return schedule;
};

/**
 * Create a trip schedule
 * @param {Object} scheduleBody
 * @param {ObjectId} userId - User ID creating the schedule
 * @returns {Promise<TripSchedule>}
 */
const createSchedule = async (scheduleBody) => {
  return TripSchedule.create(scheduleBody);
};

/**
 * Update trip schedule by id
 * @param {ObjectId} scheduleId
 * @param {Object} updateBody
 * @returns {Promise<TripSchedule>}
 */
const updateSchedule = async (scheduleId, updateBody) => {
  const schedule = await getScheduleById(scheduleId);
  
  // Don't allow updating certain fields
  const safeUpdateBody = { ...updateBody };
  delete safeUpdateBody.createdAt;
  
  Object.assign(schedule, safeUpdateBody);
  await schedule.save();
  return schedule;
};

/**
 * Delete trip schedule by id (soft delete)
 * @param {ObjectId} scheduleId
 * @param {ObjectId} userId - User ID deleting the schedule
 * @returns {Promise<TripSchedule>}
 */
const deleteSchedule = async (scheduleId, userId) => {
  const schedule = await getScheduleById(scheduleId);
  
  // Soft delete
  schedule.isActive = false;
  schedule.deletedAt = new Date();
  schedule.deletedBy = userId;
  await schedule.save();
  
  return schedule;
};

/**
 * Get schedules by driver ID
 * @param {ObjectId} driverId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getSchedulesByDriver = async (driverId, options = {}) => {
  const filter = { driverId, isActive: true, deletedAt: null };
  return getSchedules(filter, options);
};

/**
 * Get schedules by vehicle ID
 * @param {ObjectId} vehicleId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getSchedulesByVehicle = async (vehicleId, options = {}) => {
  const filter = { vehicleId, isActive: true, deletedAt: null };
  return getSchedules(filter, options);
};

/**
 * Check vehicle and driver availability for a time range
 * @param {ObjectId} vehicleId
 * @param {ObjectId} driverId
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {ObjectId} [excludeScheduleId] - Schedule ID to exclude (for updates)
 * @returns {Promise<{isAvailable: boolean, conflictingSchedules: TripSchedule[]}>}
 */
const checkAvailability = async (vehicleId, driverId, startTime, endTime, excludeScheduleId = null) => {
  const dateFilter = {
    $or: [
      // Schedule start time falls within the requested range
      { 'destinations.tripStartTime': { $gte: startTime, $lte: endTime } },
      // Schedule end time falls within the requested range
      { 'destinations.tripApproxArrivalTime': { $gte: startTime, $lte: endTime } },
      // Schedule encompasses the requested range
      {
        $and: [
          { 'destinations.tripStartTime': { $lte: startTime } },
          { 'destinations.tripApproxArrivalTime': { $gte: endTime } }
        ]
      }
    ]
  };

  // Create filter for checking conflicts
  const filter = {
    isActive: true,
    deletedAt: null,
    $or: [
      { vehicleId },
      { driverId }
    ],
    ...dateFilter
  };

  // Exclude the current schedule if provided (for updates)
  if (excludeScheduleId) {
    filter._id = { $ne: excludeScheduleId };
  }

  // Find conflicting schedules
  const conflictingSchedules = await TripSchedule.find(filter)
    .populate('driverId', 'name')
    .populate('vehicleId', 'name licensePlate');

  return {
    isAvailable: conflictingSchedules.length === 0,
    conflictingSchedules
  };
};

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByDriver,
  getSchedulesByVehicle,
  checkAvailability
}; 