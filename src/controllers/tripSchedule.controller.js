const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { tripScheduleService, tripRequestService } = require('../services');
const ApiError = require('../utils/ApiError');
const { sendNotificationsToRoles, formatTripScheduleNotification, sendNotificationsToIds } = require('../utils/notifcationHelper');
/**
 * Get all trip schedules with filtering and pagination
 * @route GET /schedules
 */
const getSchedules = catchAsync(async (req, res) => {
  const filter = {
    isActive: true,
    deletedAt: null,
  };
  
  // Add driver and vehicle filters
  if (req.query.driverId) {
    filter.driverId = req.query.driverId;
  }
  
  if (req.query.vehicleId) {
    filter.vehicleId = req.query.vehicleId;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // Add date range filter for trip start time
  if (req.query.dateFrom || req.query.dateTo) {
    // Create a proper $or query at the top level of the filter
    if (!filter.$or) {
      filter.$or = [];
    }
    
    // Build date conditions
    const dateConditions = {};
    
    if (req.query.dateFrom) {
      const fromDate = new Date(req.query.dateFrom);
      dateConditions.$gte = fromDate;
    }
    
    if (req.query.dateTo) {
      const toDate = new Date(req.query.dateTo);
      dateConditions.$lte = toDate;
    }
    
    // Apply date conditions to different fields
    if (Object.keys(dateConditions).length > 0) {
      filter.$or.push({ tripStartTime: dateConditions });
      filter.$or.push({ actualStartTime: dateConditions });
    }
  }
  
  const options = {
    sortBy: req.query.sortBy,
    limit: req.query.limit,
    page: req.query.page,
  };
  
  const result = await tripScheduleService.getSchedules(filter, options, req.user.role);
  res.send(result);
});

/**
 * Get trip schedule by id
 * @route GET /schedules/:id
 */
const getSchedule = catchAsync(async (req, res) => {
  const tripSchedule = await tripScheduleService.getScheduleById(req.params.id);
  if (!tripSchedule) {
    throw new ApiError(httpStatus.status.NOT_FOUND, 'Trip schedule not found');
  }
  res.send(tripSchedule);
});

/**
 * Create a new trip schedule
 * @route POST /schedules
 */
const createSchedule = catchAsync(async (req, res) => {
  try {
    // Create schedule
    const tripSchedule = await tripScheduleService.createSchedule(req.body, req.user._id);
    
    // Update trip requests to mark them as scheduled
    for (const destination of req.body.destinations) {
      if (destination.requestId) {
        await tripRequestService.updateRequestLinkStatus(destination.requestId, tripSchedule.id);
      }
    }

    tripScheduleService.getScheduleById(tripSchedule.id).then(tripScheduleData => {

    // Notify all schedulers-admins-super-admins
    sendNotificationsToRoles(['scheduler', 'admin', 'super-admin'], ['receiveTripScheduledNotification'], 'New Trip Schedule', formatTripScheduleNotification(tripScheduleData), {
      tripScheduleId: tripSchedule._id.toString()
    }).catch(error => {
      console.error('Send notification error:', error);
    },[req.user._id]);

    // Collect all requesters IDs
    let requestedPersonIds = [];
    tripScheduleData.destinations.forEach(dest => {
      if (dest.createdBy) {
        requestedPersonIds.push(dest.createdBy.id.toString());
      }
    });

    // Notify requested person(s)
    if (requestedPersonIds.length > 0) {
      sendNotificationsToIds(requestedPersonIds, [], 'Your Request is Scheduled', formatTripScheduleNotification(tripScheduleData), {
        tripScheduleId: tripSchedule._id.toString()
      }).catch(error => {
        console.error('Send notification error:', error);
      });
    }
  }).catch(error => {
    console.error('Error getting trip schedule data:', error);
  });
  
    res.status(httpStatus.status.CREATED).send(tripSchedule);
  } catch (error) {
    if(error instanceof ApiError){
      throw error;
    }
    throw new ApiError(httpStatus.status.UNKNOWN_ERROR, error.message);
  }
});

/**
 * Update trip schedule by id
 * @route PUT /schedules/:id
 */
const updateSchedule = catchAsync(async (req, res) => {
  
  const tripSchedule = await tripScheduleService.updateSchedule(req.params.id, req.body, req.user._id);

  // Updated schedule
  tripScheduleService.getScheduleById(req.params.id).then(updatedSchedule => {

  // Notify all schedulers-admins-super-admins
  sendNotificationsToRoles(['scheduler', 'admin', 'super-admin'], ['receiveTripScheduledNotification'], 'Trip Re-Scheduled', formatTripScheduleNotification(updatedSchedule), {
    tripScheduleId: tripSchedule.id.toString()
  }).catch(error => {
    console.error('Send notification error:', error);
  },[req.user._id]);

  // Collect all requesters IDs
  let requestedPersonIds = [];
  updatedSchedule.destinations.forEach(dest => {
    if (dest.createdBy) {
      requestedPersonIds.push(dest.createdBy.id.toString());
    }
  });

  // Notify requested person(s)
  if (requestedPersonIds.length > 0) {
    sendNotificationsToIds(requestedPersonIds, [], 'Your Request is Re-Scheduled', formatTripScheduleNotification(updatedSchedule), {
      tripScheduleId: tripSchedule.id.toString()
    }).catch(error => {
      console.error('Send notification error:', error);
    });
  }
  }).catch(error => {
    console.error('Error getting trip schedule data:', error);
  });
  
  res.send(tripSchedule);
});

/**
 * Delete trip schedule by id
 * @route DELETE /schedules/:id 
 */
const deleteSchedule = catchAsync(async (req, res) => {
  const schedule = await tripScheduleService.getScheduleById(req.params.id, false);
  
  // Unlink all trip requests
  if (schedule && schedule.destinations) {
    for (const destination of schedule.destinations) {
      if (destination.requestId._id) {
        await tripRequestService.updateRequestLinkStatus(destination.requestId._id, null);
      }
    }
  }
  
  await tripScheduleService.deleteSchedule(req.params.id, req.user._id);
  res.status(httpStatus.status.NO_CONTENT).send();
});

/**
 * Cancel trip schedule by id
 * @route DELETE /schedules/:id/cancel 
 */
const cancelSchedule = catchAsync(async (req, res) => {
  const schedule = await tripScheduleService.getScheduleById(req.params.id, false);
  
  // Unlink all trip requests
  if (schedule && schedule.destinations) {
    for (const destination of schedule.destinations) {
      if (destination.requestId._id) {
        await tripRequestService.updateRequestLinkStatus(destination.requestId._id, null);
      }
    }
  }
  
  await tripScheduleService.cancelSchedule(req.params.id, req.user._id);

  tripScheduleService.getScheduleById(req.params.id).then(cancelledSchedule => {

  // Notify all schedulers-admins-super-admins
  sendNotificationsToRoles(['scheduler', 'admin', 'super-admin'], ['receiveTripScheduledNotification'], 'Trip Cancelled', formatTripScheduleNotification(cancelledSchedule), {
    tripScheduleId: cancelledSchedule.id.toString()
  }).catch(error => {
    console.error('Send notification error:', error);
  },[req.user._id]);

  // Collect all requesters IDs
  let requestedPersonIds = [];
  cancelledSchedule.destinations.forEach(dest => {
    if (dest.createdBy) {
      requestedPersonIds.push(dest.createdBy.id.toString());
    }
  });

  // Notify requested person(s)
  if (requestedPersonIds.length > 0) {
    sendNotificationsToIds(requestedPersonIds, [], 'Your Scheduled Trip is Cancelled', formatTripScheduleNotification(cancelledSchedule), {
      tripScheduleId: cancelledSchedule.id.toString()
    }).catch(error => {
      console.error('Send notification error:', error);
    });
  }
  }).catch(error => {
    console.error('Error getting trip schedule data:', error);
  });

  res.status(httpStatus.status.NO_CONTENT).send();
});

/**
 * Check availability for scheduling
 * @route POST /schedules/check-availability
 */
const checkAvailability = catchAsync(async (req, res) => {
  const { vehicleId, driverId, startTime, endTime, scheduleId } = req.body;
  
  const result = await tripScheduleService.checkAvailability(
    vehicleId,
    driverId,
    new Date(startTime),
    new Date(endTime),
    scheduleId
  );
  
  res.send(result);
});

/**
 * Get trips scheduled for the authenticated driver
 * @route GET /api/trip-schedules/driver/me
 * @access Private - Driver
 */
const getDriverMyTrips = catchAsync(async (req, res) => {
  const { status, startDate, endDate, page, limit } = req.query;
  
  const trips = await tripScheduleService.getDriverTrips(req.user._id, {
    status,
    startDate,
    endDate,
    page,
    limit
  });
  
  return res.status(httpStatus.status.OK).json({
    success: true,
    data: trips
  });
});

/**
 * Get upcoming trips for the authenticated driver
 * @route GET /api/trip-schedules/driver/me/upcoming
 * @access Private - Driver
 */
const getDriverMyUpcomingTrips = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  
  const trips = await tripScheduleService.getDriverUpcomingTrips(req.user._id, {
    page,
    limit
  });
  
  return res.status(httpStatus.status.OK).json({
    success: true,
    data: trips
  });
});

/**
 * Start a trip (change status to in-progress)
 * @route PATCH /api/trip-schedules/:tripId/start
 * @access Private - Driver
 */
const startTrip = catchAsync(async (req, res) => {
  const { tripId } = req.params;
  const { odometer, coordinates } = req.body;
  
  if (!odometer) {
    throw new ApiError(httpStatus.status.BAD_REQUEST, 'Odometer reading is required');
  }
  
  const trip = await tripScheduleService.startTrip(tripId, req.user._id, {
    odometer,
    coordinates
  });
  
  return res.status(httpStatus.status.OK).json({
    success: true,
    message: 'Trip started successfully',
    data: trip
  });
});

/**
 * Complete a trip
 * @route PATCH /api/trip-schedules/:tripId/complete
 * @access Private - Driver
 */
const completeTrip = catchAsync(async (req, res) => {
  const { tripId } = req.params;
  const { odometer, notes, coordinates } = req.body;
  
  if (!odometer) {
    throw new ApiError(httpStatus.status.BAD_REQUEST, 'Odometer reading is required');
  }
  
  const trip = await tripScheduleService.completeTrip(tripId, req.user._id, {
    odometer,
    notes,
    coordinates
  });
  
  return res.status(httpStatus.status.OK).json({
    success: true,
    message: 'Trip completed successfully',
    data: trip
  });
});

module.exports = {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  cancelSchedule,
  checkAvailability,
  getDriverMyTrips,
  getDriverMyUpcomingTrips,
  startTrip,
  completeTrip
}; 