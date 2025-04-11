const { status } = require('http-status');
const { TripSchedule } = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');
const mongoose = require('mongoose');

/**
 * Format trip schedule data according to required structure
 * @param {Object} schedule - Trip schedule document
 * @returns {Object} Formatted trip schedule
 */
const formatTripSchedule = (schedule) => {
  const formatted = {
    id: schedule._id,
    status: 'scheduled', // Since we're only getting active schedules
    driver: schedule.driverId ? {
      id: schedule.driverId._id,
      name: schedule.driverId.name,
      phone: schedule.driverId.phone,
      email: schedule.driverId.email
    } : null,
    vehicle: schedule.vehicleId ? {
      id: schedule.vehicleId._id,
      name: schedule.vehicleId.name
    } : null,
    destinations: schedule.destinations.map(dest => ({
      requestId: dest.requestId?._id || null,
      destination: dest.requestId?.destination || null,
      purpose: dest.requestId?.purpose ? {
        id: dest.requestId.purpose._id,
        name: dest.requestId.purpose.name,
        jobCardNeeded: dest.requestId.purpose.jobCardNeeded
      } : null,
      tripStartTime: dest.tripStartTime,
      tripApproxArrivalTime: dest.tripApproxArrivalTime,
      tripPurposeTime: dest.tripPurposeTime,
      jobCardId: dest.requestId?.jobCardId || null,
      noOfPeople: dest.requestId?.noOfPeople || null,
      createdBy: dest.requestId?.createdBy ? {
        id: dest.requestId.createdBy._id,
        name: dest.requestId.createdBy.name,
        phone: dest.requestId.createdBy.phone
      } : null
    })),
    tripStartTime: schedule.destinations[0]?.tripStartTime,
    tripApproxReturnTime: schedule.destinations[schedule.destinations.length - 1]?.tripApproxArrivalTime,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt
  };

  return formatted;
};

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
  
  const schedules = await TripSchedule.find(mergedFilter)
    .populate('driverId', 'name email phone')
    .populate('vehicleId', 'name')
    .populate({
      path: 'destinations.requestId',
      select: 'destination purpose jobCardId noOfPeople createdBy',
      populate: [
        {
          path: 'purpose',
          select: 'name jobCardNeeded'
        },
        {
          path: 'createdBy',
          select: 'name phone'
        }
      ]
    })
    .sort(options.sortBy ? options.sortBy : { createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  const total = await TripSchedule.countDocuments(mergedFilter);
  
  const formattedResults = schedules.map(formatTripSchedule);

  return {
    filters: { status: 'scheduled' },
    data: formattedResults,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalResults: total,
      totalPages: Math.ceil(total / pagination.limit)
    }
  };
};

/**
 * Get trip schedule by id
 * @param {ObjectId} id
 * @returns {Promise<TripSchedule>}
 */
const getScheduleById = async (id) => {
  const schedule = await TripSchedule.findOne({ _id: id, isActive: true, deletedAt: null })
    .populate('driverId', 'name email phone')
    .populate('vehicleId', 'name')
    .populate({
      path: 'destinations.requestId',
      select: 'destination purpose jobCardId noOfPeople createdBy',
      populate: [
        {
          path: 'purpose',
          select: 'name jobCardNeeded'
        },
        {
          path: 'createdBy',
          select: 'name phone'
        }
      ]
    });
  
  if (!schedule) {
    throw new ApiError(status.NOT_FOUND, 'Trip schedule not found');
  }
  
  return formatTripSchedule(schedule);
};

/**
 * Create a trip schedule
 * @param {Object} scheduleBody
 * @param {ObjectId} userId - User ID creating the schedule
 * @returns {Promise<TripSchedule>}
 */
const createSchedule = async (scheduleBody, userId) => {
  scheduleBody.createdBy = userId;
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