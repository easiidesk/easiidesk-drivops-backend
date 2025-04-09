const {status} = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { tripRequestService } = require('../services');
const ApiError = require('../utils/ApiError');
const { successResponse } = require('../common/responses/response.utils');

/**
 * Get all trip requests with filtering and pagination
 * @route GET /trip-requests
 */
const getTripRequests = catchAsync(async (req, res) => {
  const filter = {
    deletedAt: null,
  };
  
  // Add status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // Add date range filter
  if (req.query.dateFrom || req.query.dateTo) {
    filter.dateTime = {};
    if (req.query.dateFrom) {
      filter.dateTime.$gte = new Date(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      filter.dateTime.$lte = new Date(req.query.dateTo);
    }
  }
  
  // Add creator filter if specified
  if (req.query.createdBy) {
    filter.createdBy = req.query.createdBy;
  }

  if (req.query.driverId) {
    filter.driverId = req.query.driverId;
  }
  if (req.query.vehicleId) {
    filter.requiredVehicle = { $in: req.query.vehicleId };
  }
  const options = {
    sortBy: req.query.sortBy,
    limit: req.query.limit,
    page: req.query.page,
  };
  
  const result = await tripRequestService.getTripRequests(filter, options);
  
  // Format response according to required structure
  const formattedResponse = {
    data: result.results,
    pagination: {
      total: result.totalResults,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    }
  };
  
  res.send(formattedResponse);
});

/**
 * Get trip request by id
 * @route GET /trip-requests/:id
 */
const getTripRequest = catchAsync(async (req, res) => {
  const tripRequest = await tripRequestService.getTripRequestById(req.params.id);
  if (!tripRequest) {
    throw new ApiError(status.NOT_FOUND, 'Trip request not found');
  }
  res.send(tripRequest);
});

/**
 * Create a new trip request
 * @route POST /trip-requests
 */
const createTripRequest = catchAsync(async (req, res) => {
  const tripRequest = await tripRequestService.createTripRequest(req.body, req.user._id);
  res.status(status.CREATED).send(tripRequest);
});

/**
 * Update trip request by id
 * @route PUT /trip-requests/:id
 */
const updateTripRequest = catchAsync(async (req, res) => {
  const tripRequest = await tripRequestService.updateTripRequest(req.params.id, req.body);
  res.send(tripRequest);
});

/**
 * Delete trip request by id
 * @route DELETE /trip-requests/:id
 */
const deleteTripRequest = catchAsync(async (req, res) => {
  await tripRequestService.deleteTripRequest(req.params.id, req.user._id);
  res.status(status.NO_CONTENT).send();
});

module.exports = {
  getTripRequests,
  getTripRequest,
  createTripRequest,
  updateTripRequest,
  deleteTripRequest,
}; 