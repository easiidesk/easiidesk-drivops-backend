const {status} = require('http-status');
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
    filter['destinations.tripStartTime'] = {};
    if (req.query.dateFrom) {
      filter['destinations.tripStartTime'].$gte = new Date(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      filter['destinations.tripStartTime'].$lte = new Date(req.query.dateTo);
    }
  }
  
  const options = {
    sortBy: req.query.sortBy,
    limit: req.query.limit,
    page: req.query.page,
  };
  
  const result = await tripScheduleService.getSchedules(filter, options);
  res.send(result);
});

/**
 * Get trip schedule by id
 * @route GET /schedules/:id
 */
const getSchedule = catchAsync(async (req, res) => {
  const tripSchedule = await tripScheduleService.getScheduleById(req.params.id);
  if (!tripSchedule) {
    throw new ApiError(status.NOT_FOUND, 'Trip schedule not found');
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

    const tripScheduleData = await tripScheduleService.getScheduleById(tripSchedule.id);

    // Notify all schedulers-admins-super-admins
    sendNotificationsToRoles(['scheduler', 'admin', 'super-admin'], ['receiveTripScheduledNotification'], 'New Trip Schedule', formatTripScheduleNotification(tripScheduleData), {
      tripScheduleId: tripSchedule._id.toString()
    }).catch(error => {
      console.error('Send notification error:', error);
    });

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
  
    res.status(status.CREATED).send(tripSchedule);
  } catch (error) {
    throw new ApiError(status.UNKNOWN_ERROR, error.message);
  }
});

/**
 * Update trip schedule by id
 * @route PUT /schedules/:id
 */
const updateSchedule = catchAsync(async (req, res) => {
  
  const tripSchedule = await tripScheduleService.updateSchedule(req.params.id, req.body, req.user._id);

  // Updated schedule
  const updatedSchedule = await tripScheduleService.getScheduleById(req.params.id);

  // Notify all schedulers-admins-super-admins
  sendNotificationsToRoles(['scheduler', 'admin', 'super-admin'], ['receiveTripScheduledNotification'], 'Trip Re-Scheduled', formatTripScheduleNotification(updatedSchedule), {
    tripScheduleId: tripSchedule.id.toString()
  }).catch(error => {
    console.error('Send notification error:', error);
  });

  // Collect all requesters IDs
  let requestedPersonIds = [];
  tripSchedule.destinations.forEach(dest => {
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
  res.status(status.NO_CONTENT).send();
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
  res.status(status.NO_CONTENT).send();
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

module.exports = {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  cancelSchedule,
  checkAvailability,
}; 