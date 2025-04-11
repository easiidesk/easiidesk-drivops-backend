const { status } = require('http-status');
const { TripSchedule, TripRequest, TripPurpose } = require('../models');
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
    status: schedule.status,
    createdBy: schedule.createdBy ? {
      id: schedule.createdBy._id,
      name: schedule.createdBy.name,
      phone: schedule.createdBy.phone,
      email: schedule.createdBy.email
    } : null,
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
    destinations: schedule.destinations.map(dest => {
      if (dest.requestId) {
        // Case 1: When requestId exists
        return {
          requestId: dest.requestId._id,
          destination: dest.requestId.destination,
          purpose: dest.requestId.purpose ? {
            id: dest.requestId.purpose._id,
            name: dest.requestId.purpose.name,
            jobCardNeeded: dest.requestId.purpose.jobCardNeeded
          } : null,
          tripStartTime: dest.tripStartTime,
          tripApproxArrivalTime: dest.tripApproxArrivalTime,
          tripPurposeTime: dest.tripPurposeTime,
          jobCardId: dest.requestId.jobCardId || null,
          noOfPeople: dest.requestId.noOfPeople || null,
          createdBy: dest.requestId.createdBy ? {
            id: dest.requestId.createdBy._id,
            name: dest.requestId.createdBy.name,
            phone: dest.requestId.createdBy.phone
          } : null
        };
      } else {
        // Case 2: When requestId is null and we have direct purposeId and destination
        return {
          requestId: null,
          destination: dest.destination,
          purpose: dest.purposeId ? {
            id: dest.purposeId._id,
            name: dest.purposeId.name,
            jobCardNeeded: dest.purposeId.jobCardNeeded
          } : null,
          tripStartTime: dest.tripStartTime,
          tripApproxArrivalTime: dest.tripApproxArrivalTime,
          tripPurposeTime: dest.tripPurposeTime,
          jobCardId: null,
          noOfPeople: null,
          createdBy: dest.destinationAddedBy ? {
            id: dest.destinationAddedBy._id,
            name: dest.destinationAddedBy.name,
            phone: dest.destinationAddedBy.phone
          } : null
        };
      }
    }),
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
    .populate('createdBy', 'name email phone')
    .populate('destinations.purposeId', 'name jobCardNeeded')
    .populate('destinations.destinationAddedBy', 'name email phone')
    .populate({
      path: 'destinations.requestId',
      select: 'destination purpose jobCardId noOfPeople createdBy',
      populate: [
        {
          path: 'purpose',
          select: 'name jobCardNeeded',
          model: 'TripPurpose'
        },
        {
          path: 'createdBy',
          select: 'name phone'
        }
      ]
    })
    .sort(options.sortBy ? options.sortBy : { tripStartTime: 1 })
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
 * @param {boolean} [formatted=true] - Whether to return formatted data
 * @returns {Promise<TripSchedule>}
 */
const getScheduleById = async (id, formatted = true) => {
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
  
  return formatted ? formatTripSchedule(schedule) : schedule;
};

/**
 * Create a trip schedule
 * @param {Object} scheduleBody
 * @param {ObjectId} userId - User ID creating the schedule
 * @returns {Promise<TripSchedule>}
 */
const createSchedule = async (scheduleBody, userId) => {
  scheduleBody.createdBy = userId;
  scheduleBody.status = 'scheduled';
  scheduleBody.tripStartTime = new Date(scheduleBody.tripStartTime);
  scheduleBody.tripApproxArrivalTime = scheduleBody.tripApproxArrivalTime ? new Date(scheduleBody.tripApproxArrivalTime) : null;
  return TripSchedule.create(scheduleBody);
  };

/**
 * Update trip schedule by id
 * @param {ObjectId} scheduleId
 * @param {Object} updateBody
 * @returns {Promise<TripSchedule>}
 */
const updateSchedule = async (scheduleId, updateBody, userId) => {
  const schedule = await getScheduleById(scheduleId, false); // Get raw document
  
  const existingRequestIds=schedule.destinations.map(dest=>dest.requestId?._id.toString());
  const updatedRequestIds=updateBody.destinations.map(dest=>dest.requestId);
  const newlyAddedRequestIds=updatedRequestIds.filter(id=>!existingRequestIds.includes(id));
  const deletedRequestIds=existingRequestIds.filter(id=>!updatedRequestIds.includes(id));


  let updatedTripStartTime;
  let updatedTripApproxArrivalTime;

  updateBody.destinations.forEach(dest => {
    if (dest.tripStartTime < updatedTripStartTime) {
      updatedTripStartTime = dest.tripStartTime;
    }
    if (dest.tripApproxArrivalTime > updatedTripApproxArrivalTime) {
      updatedTripApproxArrivalTime = dest.tripApproxArrivalTime;
    }

    if(!dest.requestId){
      dest.destinationAddedBy=userId;
      dest.destinationAddedAt=new Date();
    }
    
  });

  // Don't allow updating certain fields
  const safeUpdateBody = { ...updateBody };
  delete safeUpdateBody.createdAt;

  
  Object.assign(schedule, safeUpdateBody);
 

  schedule.tripStartTime = updatedTripStartTime;
  schedule.tripApproxArrivalTime = updatedTripApproxArrivalTime;

 
   //find trip requests by ids and update status to 'scheduled'
   await TripRequest.updateMany({_id:{$in:newlyAddedRequestIds}},{$set:{status:'scheduled', linkedTripId: schedule._id}});
   //find trip requests by ids and update status to 'pending', 'cancelled'
   await TripRequest.updateMany({_id:{$in:deletedRequestIds}},{$set:{status:'pending',linkedTripId:null}});

  await schedule.save();
 

  return formatTripSchedule(schedule); // Return formatted data
};

/**
 * Delete trip schedule by id (soft delete)
 * @param {ObjectId} scheduleId
 * @param {ObjectId} userId - User ID deleting the schedule
 * @returns {Promise<TripSchedule>}
 */
const deleteSchedule = async (scheduleId, userId) => {
  const schedule = await getScheduleById(scheduleId, false);
  
  // Soft delete
  schedule.isActive = false;
  schedule.deletedAt = new Date();
  schedule.deletedBy = userId;
  await schedule.save();
  
  return schedule;
};

/**
 * Cancel trip schedule by id
 * @param {ObjectId} scheduleId
 * @param {ObjectId} userId - User ID cancelling the schedule
 * @returns {Promise<TripSchedule>}
 */
const cancelSchedule = async (scheduleId, userId) => {
  const schedule = await getScheduleById(scheduleId, false);
  
  // Soft delete
  schedule.status = 'cancelled';
  schedule.cancelledBy = userId;
  schedule.cancelledAt = new Date();
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
  cancelSchedule,
  getSchedulesByDriver,
  getSchedulesByVehicle,
  checkAvailability
}; 