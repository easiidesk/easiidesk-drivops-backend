const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { tripScheduleService, tripRequestService } = require('../services');
const ApiError = require('../utils/ApiError');

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
    throw new ApiError(httpStatus.NOT_FOUND, 'Trip schedule not found');
  }
  res.send(tripSchedule);
});

/**
 * Create a new trip schedule
 * @route POST /schedules
 */
const createSchedule = catchAsync(async (req, res) => {
  // Check availability first
  const firstDestination = req.body.destinations[0];
  const lastDestination = req.body.destinations[req.body.destinations.length - 1];
  
  const startTime = new Date(firstDestination.tripStartTime);
  const endTime = lastDestination.tripApproxArrivalTime 
    ? new Date(lastDestination.tripApproxArrivalTime)
    : new Date(startTime.getTime() + 3600000); // Default to 1 hour later if not specified
  
  const availabilityCheck = await tripScheduleService.checkAvailability(
    req.body.vehicleId,
    req.body.driverId,
    startTime,
    endTime
  );
  
  if (!availabilityCheck.isAvailable) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Vehicle or driver is not available for the requested time period',
      { conflictingSchedules: availabilityCheck.conflictingSchedules }
    );
  }
  
  // Create schedule
  const tripSchedule = await tripScheduleService.createSchedule(req.body);
  
  // Update trip requests to mark them as scheduled
  for (const destination of req.body.destinations) {
    if (destination.requestId) {
      await tripRequestService.updateRequestLinkStatus(destination.requestId, tripSchedule.id);
    }
  }
  
  res.status(httpStatus.CREATED).send(tripSchedule);
});

/**
 * Update trip schedule by id
 * @route PUT /schedules/:id
 */
const updateSchedule = catchAsync(async (req, res) => {
  // If destinations are being changed, check availability
  if (req.body.destinations || req.body.driverId || req.body.vehicleId) {
    const currentSchedule = await tripScheduleService.getScheduleById(req.params.id);
    
    const destinations = req.body.destinations || currentSchedule.destinations;
    const firstDestination = destinations[0];
    const lastDestination = destinations[destinations.length - 1];
    
    const startTime = new Date(firstDestination.tripStartTime);
    const endTime = lastDestination.tripApproxArrivalTime 
      ? new Date(lastDestination.tripApproxArrivalTime)
      : new Date(startTime.getTime() + 3600000); // Default to 1 hour later
    
    const vehicleId = req.body.vehicleId || currentSchedule.vehicleId;
    const driverId = req.body.driverId || currentSchedule.driverId;
    
    const availabilityCheck = await tripScheduleService.checkAvailability(
      vehicleId,
      driverId,
      startTime,
      endTime,
      req.params.id // Exclude current schedule from availability check
    );
    
    if (!availabilityCheck.isAvailable) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Vehicle or driver is not available for the requested time period',
        { conflictingSchedules: availabilityCheck.conflictingSchedules }
      );
    }
  }
  
  const tripSchedule = await tripScheduleService.updateSchedule(req.params.id, req.body);
  
  // Update linked trip requests
  if (req.body.destinations) {
    // Collect all requestIds
    const requestIds = req.body.destinations
      .filter(dest => dest.requestId)
      .map(dest => dest.requestId);
    
    // First, update all requests that are newly linked
    for (const requestId of requestIds) {
      await tripRequestService.updateRequestLinkStatus(requestId, tripSchedule.id);
    }
  }
  
  res.send(tripSchedule);
});

/**
 * Delete trip schedule by id
 * @route DELETE /schedules/:id 
 */
const deleteSchedule = catchAsync(async (req, res) => {
  const schedule = await tripScheduleService.getScheduleById(req.params.id);
  
  // Unlink all trip requests
  if (schedule && schedule.destinations) {
    for (const destination of schedule.destinations) {
      if (destination.requestId) {
        await tripRequestService.updateRequestLinkStatus(destination.requestId, null);
      }
    }
  }
  
  await tripScheduleService.deleteSchedule(req.params.id, req.user._id);
  res.status(httpStatus.NO_CONTENT).send();
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
  checkAvailability,
}; 