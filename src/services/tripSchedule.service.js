const { status } = require('http-status');
const { TripSchedule, TripRequest, TripPurpose } = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Vehicle = require('../models/vehicle.model');
const DriverLocation = require('../models/driverLocation.model');
const httpStatus = require('http-status');
const { sendNotificationsToRoles } = require('../utils/notifcationHelper');
const { createTripStartedNotification, createTripEndedNotification } = require('../notificationTemplates/trips');
const driverAttendanceService = require('../services/driverAttendance.service');

/**
 * Format trip schedule data according to required structure
 * @param {Object} schedule - Trip schedule document
 * @returns {Object} Formatted trip schedule
 */
const formatTripSchedule = (schedule, needActualTrip = false) => {
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
        // Case 1: When requestId exists and is populated
        const requestDestinations = dest.requestId.destinations || [];
        return {
          requestId: dest.requestId._id,
          destinations: requestDestinations.map(rdest => ({
            destination: rdest.destination,
            isWaiting: rdest.isWaiting,
            jobCardId: rdest.jobCardId,
            mapLink: rdest.mapLink,
            purpose: rdest.purpose ? {
              id: rdest.purpose._id,
              name: rdest.purpose.name,
              jobCardNeeded: rdest.purpose.jobCardNeeded
            } : null
          })),
          tripStartTime: dest.tripStartTime,
          tripApproxArrivalTime: dest.tripApproxArrivalTime,
          tripPurposeTime: dest.tripPurposeTime,
          jobCardId: dest.requestId.jobCardId || null,
          noOfPeople: dest.requestId.noOfPeople || 0,
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
    updatedAt: schedule.updatedAt,
    actualTrip: needActualTrip ? {
      startOdometer: schedule.startOdometer,
      endOdometer: schedule.endOdometer,
      distanceTraveled: schedule.distanceTraveled,
      actualStartTime: schedule.actualStartTime,
      actualEndTime: schedule.actualEndTime
    } : null
  };

  return formatted;
};

/**
 * Get all trip schedules with pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getSchedules = async (filter = {}, options = {}, requestingUserRole) => {
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
      select: 'destinations jobCardId noOfPeople createdBy',
      populate: [
        {
          path: 'destinations.purpose',
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
  
  const formattedResults = schedules.map(schedule => formatTripSchedule(schedule, requestingUserRole.includes('admin') || requestingUserRole.includes('super-admin')));

  return {
    filters: { status: 'scheduled' },
    data: formattedResults,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalResults: total,
      totalPages: pagination.pagination==false?1:Math.ceil(total / pagination.limit)
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
    .populate('createdBy', 'name email phone')
    .populate('destinations.purposeId', 'name jobCardNeeded')
    .populate('destinations.destinationAddedBy', 'name email phone')
    .populate({
      path: 'destinations.requestId',
      select: 'destinations jobCardId noOfPeople createdBy',
      populate: [
        {
          path: 'destinations.purpose',
          select: 'name jobCardNeeded',
          model: 'TripPurpose'
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

  //calculate trip start time and trip approx arrival time
  // Initialize with first destination's times
  let tripStartTime = new Date(scheduleBody.destinations[0].tripStartTime);
  let tripApproxArrivalTime = scheduleBody.destinations[0].tripApproxArrivalTime ? new Date(scheduleBody.destinations[0].tripApproxArrivalTime) : null;

  scheduleBody.destinations.forEach(dest => {
    const destStartTime = new Date(dest.tripStartTime);
    const destArrivalTime = dest.tripApproxArrivalTime ? new Date(dest.tripApproxArrivalTime) : null;

    if (destStartTime < tripStartTime) {
      tripStartTime = destStartTime;
    }
    if (destArrivalTime && destArrivalTime > tripApproxArrivalTime) {
      tripApproxArrivalTime = destArrivalTime;
    }

    if(!dest.requestId){
      dest.destinationAddedBy = userId;
      dest.destinationAddedAt = new Date();
    }
  });
  
  // Check vehicle and driver availability before creating the schedule
  // If isForceSchedule is true, skip availability check
  if (!scheduleBody.isForceSchedule) {
    const { isAvailable, conflictingSchedules } = await checkAvailability(
      scheduleBody.vehicleId,
      scheduleBody.driverId,
      tripStartTime,
      tripApproxArrivalTime
    );
    
    if (!isAvailable) {
      const conflictDetails = conflictingSchedules.map(s => ({
        id: s._id,
        driver: s.driverId?.name || 'Unknown driver',
        vehicle: s.vehicleId?.name || 'Unknown vehicle',
        time: `${new Date(s.destinations[0]?.tripStartTime).toISOString()} to ${new Date(s.destinations[s.destinations.length-1]?.tripApproxArrivalTime).toISOString()}`
      }));
      
      // Determine what's conflicting
      const vehicleConflicts = conflictingSchedules.filter(s => s.vehicleId && s.vehicleId._id.toString() === scheduleBody.vehicleId.toString());
      const driverConflicts = conflictingSchedules.filter(s => s.driverId && s.driverId._id.toString() === scheduleBody.driverId.toString());
      
      let conflictMessage = '';
      if (vehicleConflicts.length > 0 && driverConflicts.length > 0) {
        conflictMessage = 'vehicle-driver';
      } else if (vehicleConflicts.length > 0) {
        conflictMessage = 'vehicle';
      } else if (driverConflicts.length > 0) {
        conflictMessage = 'driver';
      } else {
        conflictMessage = 'resource';
      }
      
      throw new ApiError(status.CONFLICT, conflictMessage, { conflictingSchedules });
    }
  }
  
  scheduleBody.tripStartTime = tripStartTime;
  scheduleBody.tripApproxArrivalTime = tripApproxArrivalTime;
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
  // Initialize with first destination's times
  let updatedTripStartTime = new Date(updateBody.destinations[0].tripStartTime);
  let updatedTripApproxArrivalTime = new Date(updateBody.destinations[0].tripApproxArrivalTime);

  updateBody.destinations.forEach(dest => {
    const destStartTime = new Date(dest.tripStartTime);
    const destArrivalTime = new Date(dest.tripApproxArrivalTime);

    if (destStartTime < updatedTripStartTime) {
      updatedTripStartTime = destStartTime;
    }
    if (destArrivalTime > updatedTripApproxArrivalTime) {
      updatedTripApproxArrivalTime = destArrivalTime;
    }

    if(!dest.requestId){
      dest.destinationAddedBy = userId;
      dest.destinationAddedAt = new Date();
    }
  });

  // Check vehicle and driver availability before updating the schedule
  // If isForceSchedule is true, skip availability check
  if (!updateBody.isForceSchedule) {
    const vehicleId = updateBody.vehicleId || schedule.vehicleId;
    const driverId = updateBody.driverId || schedule.driverId;
    
    const { isAvailable, conflictingSchedules } = await checkAvailability(
      vehicleId,
      driverId,
      updatedTripStartTime,
      updatedTripApproxArrivalTime,
      scheduleId // Exclude current schedule from availability check
    );
    
    if (!isAvailable) {
      // Determine what's conflicting
      const vehicleConflicts = conflictingSchedules.filter(s => s.vehicleId && s.vehicleId._id.toString() === vehicleId.toString());
      const driverConflicts = conflictingSchedules.filter(s => s.driverId && s.driverId._id.toString() === driverId.toString());
      
      let conflictMessage = '';
      if (vehicleConflicts.length > 0 && driverConflicts.length > 0) {
        conflictMessage = 'vehicle-driver';
      } else if (vehicleConflicts.length > 0) {
        conflictMessage = 'vehicle';
      } else if (driverConflicts.length > 0) {
        conflictMessage = 'driver';
      } else {
        conflictMessage = 'resource';
      }
      
      throw new ApiError(status.CONFLICT, conflictMessage, { conflictingSchedules });
    }
  }

  // Don't allow updating certain fields
  const safeUpdateBody = { ...updateBody };
  delete safeUpdateBody.createdAt;
  
  Object.assign(schedule, safeUpdateBody);
 
  schedule.tripStartTime = updatedTripStartTime.toUTCString();
  schedule.tripApproxArrivalTime = updatedTripApproxArrivalTime.toUTCString();
  
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
  // If either startTime or endTime is null, consider as available
  if (!startTime || !endTime) {
    return {
      isAvailable: true,
      conflictingSchedules: []
    };
  }

  const dateFilter = {
    $or: [
      // Schedule start time falls within the requested range
      { 
        'destinations.tripStartTime': { $ne: null, $gte: startTime, $lte: endTime } 
      },
      // Schedule end time falls within the requested range
      { 
        'destinations.tripApproxArrivalTime': { $ne: null, $gte: startTime, $lte: endTime } 
      },
      // Schedule encompasses the requested range
      {
        $and: [
          { 'destinations.tripStartTime': { $ne: null, $lte: startTime } },
          { 'destinations.tripApproxArrivalTime': { $ne: null, $gte: endTime } }
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
    .populate('driverId', 'name email phone')
    .populate('vehicleId', 'name licensePlate color')
    .populate({
      path: 'destinations.requestId',
      select: 'destinations jobCardId noOfPeople',
      populate: {
        path: 'destinations.purpose',
        select: 'name jobCardNeeded',
        model: 'TripPurpose'
      }
    })
    .populate('destinations.purposeId', 'name jobCardNeeded');

  return {
    isAvailable: conflictingSchedules.length === 0,
    conflictingSchedules: conflictingSchedules.map(schedule => ({
      _id: schedule._id,
      driverId: schedule.driverId,
      vehicleId: schedule.vehicleId,
      status: schedule.status,
      tripStartTime: schedule.tripStartTime,
      tripApproxArrivalTime: schedule.tripApproxArrivalTime,
      destinations: schedule.destinations.map(dest => ({
        tripStartTime: dest.tripStartTime,
        tripApproxArrivalTime: dest.tripApproxArrivalTime,
        destination: dest.destination,
        jobCardId: dest.requestId?.jobCardId || null,
        tripPurposeTime: dest.tripPurposeTime || null,
        purpose: dest.purposeId ? {
          id: dest.purposeId._id,
          name: dest.purposeId.name,
          jobCardNeeded: dest.purposeId.jobCardNeeded
        } : null,
        requestId: dest.requestId ? {
          _id: dest.requestId._id,
          jobCardId: dest.requestId.jobCardId,
          noOfPeople: dest.requestId.noOfPeople,
          destinations: dest.requestId.destinations?.map(reqDest => ({
            destination: reqDest.destination,
            jobCardId: reqDest.jobCardId || null,
            isWaiting: reqDest.isWaiting || false,
            mapLink: reqDest.mapLink || null,
            purpose: reqDest.purpose ? {
              id: reqDest.purpose._id,
              name: reqDest.purpose.name,
              jobCardNeeded: reqDest.purpose.jobCardNeeded
            } : null
          }))
        } : null
      }))
    }))
  };
};

/**
 * Get trips scheduled for a specific driver
 * @param {string} driverId - Driver ID
 * @param {Object} options - Query options like pagination, filtering
 * @returns {Promise<Object>} Paginated trips for the driver
 */
const getDriverTrips = async (driverId, options = {}) => {
  // Verify driver exists
  const driver = await User.findOne({ 
    _id: driverId,
    role: 'driver',
    isActive: true,
    deletedAt: null
  });
  
  if (!driver) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Driver not found');
  }
  
  // Get pagination options
  const pagination = getPagination(options);
  
  // Build filter
  const filter = { 
    driverId, 
    isActive: true,
    deletedAt: null
  };
  
  // Filter by status if provided
  if (options.status) {
    filter.status = {$in: options.status.split(',')};
  }
  
  // Filter by date range if provided
  if (options.startDate || options.endDate) {
    filter.tripStartTime = {};
    
    if (options.startDate) {
      const startDate = new Date(options.startDate);
      startDate.setHours(0, 0, 0, 0);
      filter.tripStartTime.$gte = startDate;
    }
    
    if (options.endDate) {
      const endDate = new Date(options.endDate);
      endDate.setHours(23, 59, 59, 999);
      filter.tripStartTime.$lte = endDate;
    }
  }
  
  // Get trips with proper joins
  const schedules = await TripSchedule.find(filter)
    .populate('driverId', 'name email phone')
    .populate('vehicleId', 'name')
    .populate('createdBy', 'name email phone')
    .populate('destinations.purposeId', 'name jobCardNeeded')
    .populate('destinations.destinationAddedBy', 'name email phone')
    .populate({
      path: 'destinations.requestId',
      select: 'destinations jobCardId noOfPeople createdBy',
      populate: [
        {
          path: 'destinations.purpose',
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

  const total = await TripSchedule.countDocuments(filter);
  
  // Format results using the same formatter as getSchedules
  const formattedResults = schedules.map(formatTripSchedule, true);
  
  return {
    filters: { status: options.status || 'all' },
    data: formattedResults,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalResults: total,
      totalPages: pagination.pagination==false?1:Math.ceil(total / pagination.limit)
    }
  };
};

/**
 * Get upcoming trips for a driver
 * @param {string} driverId - Driver ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Upcoming trips
 */
const getDriverUpcomingTrips = async (driverId, options = {}) => {
  const currentDate = new Date();
  
  return getDriverTrips(driverId, {
    ...options,
    startDate: currentDate.toISOString(),
    status: 'scheduled'
  });
};

/**
 * Update trip status to in-progress
 * @param {string} tripId - Trip ID
 * @param {string} driverId - Driver ID
 * @param {Object} updateData - Data for starting the trip (odometer, etc)
 * @returns {Promise<Object>} Updated trip
 */
const startTrip = async (tripId, driverId, updateData) => {
  // Verify driver exists
  const driver = await User.findOne({ 
    _id: driverId,
    role: 'driver',
    isActive: true,
    deletedAt: null
  });
  
  if (!driver) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Driver not found');
  }
  
  // Check if driver is punched in
  const punchStatus = await driverAttendanceService.getDriverPunchStatus(driverId);
  
  if (!punchStatus.isPunchedIn) {
    throw new ApiError(
      httpStatus.BAD_REQUEST, 
      'You must be punched in before starting a trip.'
    );
  }
  
  // Find trip
  const trip = await TripSchedule.findOne({
    _id: tripId,
    driverId,
    status: 'scheduled',
    isActive: true,
    deletedAt: null
  });
  
  if (!trip) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trip not found or cannot be started');
  }
  
  // Check if driver already has another active trip
  const activeTrip = await TripSchedule.findOne({
    driverId,
    status: 'in progress',
    isActive: true,
    deletedAt: null,
    _id: { $ne: tripId }
  });
  
  if (activeTrip) {
    throw new ApiError(
      httpStatus.BAD_REQUEST, 
      'You already have an active trip. Please complete it before starting a new one.'
    );
  }
  
  // Update trip status
  trip.status = 'in progress';
  trip.startOdometer = updateData.odometer;
  trip.actualStartTime = new Date();
  
  await trip.save();
  
  // Update vehicle odometer if provided
  if (updateData.odometer && trip.vehicleId) {
    const vehicle = await Vehicle.findById(trip.vehicleId);
      vehicle.odometer = updateData.odometer;
      await vehicle.save();
  }
  
  // Record driver location if coordinates provided
  if (updateData.coordinates) {
    try {
      await DriverLocation.create({
        driverId,
        location: {
          type: 'Point',
          coordinates: updateData.coordinates
        },
        timestamp: new Date(),
        tripId: trip._id,
        source: 'trip'
      });
    } catch (error) {
      // Log but don't fail if location recording fails
      console.error('Failed to record trip start location:', error);
    }
  }
  // Get trip data and send notifications asynchronously
  getScheduleById(tripId).then(tripData => {
    sendNotificationsToRoles(['admin', 'super-admin'], ['receiveDriverTripStarted'], `Trip Started: ${tripData.driver.name}`, createTripStartedNotification(tripData), {
      tripScheduleId: tripId.toString()
    }).catch(error => {
      console.error('Send notification error:', error);
    },[]);
  }).catch(error => {
    console.error('Error getting trip data:', error); 
  });
  return trip;
};

/**
 * Complete a trip
 * @param {string} tripId - Trip ID
 * @param {string} driverId - Driver ID
 * @param {Object} updateData - Data for completing the trip
 * @returns {Promise<Object>} Updated trip
 */
const completeTrip = async (tripId, driverId, updateData) => {
  // Verify driver exists
  const driver = await User.findOne({ 
    _id: driverId,
    role: 'driver',
    isActive: true,
    deletedAt: null
  });
  
  if (!driver) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Driver not found');
  }
  
  // Find trip
  const trip = await TripSchedule.findOne({
    _id: tripId,
    driverId,
    status: 'in progress',
    isActive: true,
    deletedAt: null
  });
  
  if (!trip) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trip not found or cannot be completed');
  }
  
  // Validate data
  if (!updateData.odometer) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'End odometer reading is required');
  }
  
  if (trip.startOdometer && updateData.odometer < trip.startOdometer) {
    throw new ApiError(
      httpStatus.BAD_REQUEST, 
      'End odometer reading cannot be less than start odometer reading'
    );
  }
  
  // Calculate trip metrics
  const distanceTraveled = trip.startOdometer ? updateData.odometer - trip.startOdometer : null;
  
  // Update trip status
  trip.status = 'completed';
  trip.endOdometer = updateData.odometer;
  trip.actualEndTime = new Date();
  trip.distanceTraveled = distanceTraveled;
  trip.notes = updateData.notes || trip.notes;
  
  // Update vehicle odometer if it's higher than current
  if (updateData.odometer && trip.vehicleId) {
    const vehicle = await Vehicle.findById(trip.vehicleId);
      vehicle.odometer = updateData.odometer;
      await vehicle.save();
    
  }
  
  await trip.save();
  
  // Record driver location if coordinates provided
  if (updateData.coordinates) {
    try {
      await DriverLocation.create({
        driverId,
        location: {
          type: 'Point',
          coordinates: updateData.coordinates
        },
        timestamp: new Date(),
        tripId: trip._id,
        source: 'trip'
      });
    } catch (error) {
      // Log but don't fail if location recording fails
      console.error('Failed to record trip end location:', error);
    }
  }

   // Get trip data and send notifications asynchronously
   getScheduleById(tripId).then(tripData => {
    sendNotificationsToRoles(['admin', 'super-admin'], ['receiveDriverTripEnded'], `Trip Ended: ${tripData.driver.name}`, createTripEndedNotification(tripData), {
      tripScheduleId: tripId.toString()
    }).catch(error => {
      console.error('Send notification error:', error);
    },[]);
  }).catch(error => {
    console.error('Error getting trip data:', error); 
  });
  
  return trip;
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
  checkAvailability,
  getDriverTrips,
  getDriverUpcomingTrips,
  startTrip,
  completeTrip
}; 