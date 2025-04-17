const { status } = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { tripPurposeService } = require('../services');
const ApiError = require('../utils/ApiError');

/**
 * Get all trip purposes
 * @route GET /trip-purposes
 */
const getTripPurposes = catchAsync(async (req, res) => {
  const filter = {};
  const options = {
    sortBy: req.query.sortBy ?? 'name',
    limit: req.query.limit,
    page: req.query.page,
  };
  const result = await tripPurposeService.getTripPurposes(filter, options);
  res.send(result);
});

/**
 * Get trip purpose by id
 * @route GET /trip-purposes/:id
 */
const getTripPurpose = catchAsync(async (req, res) => {
  const tripPurpose = await tripPurposeService.getTripPurposeById(req.params.id);
  if (!tripPurpose) {
    throw new ApiError(status.NOT_FOUND, 'Trip purpose not found');
  }
  res.send(tripPurpose);
});

/**
 * Create a new trip purpose
 * @route POST /trip-purposes
 */
const createTripPurpose = catchAsync(async (req, res) => {
  const tripPurpose = await tripPurposeService.createTripPurpose(req.body);
  res.status(status.CREATED).send(tripPurpose);
});

/**
 * Update trip purpose by id
 * @route PUT /trip-purposes/:id
 */
const updateTripPurpose = catchAsync(async (req, res) => {
  const tripPurpose = await tripPurposeService.updateTripPurpose(
    req.params.id,
    req.body
  );
  res.send(tripPurpose);
});

/**
 * Delete trip purpose by id
 * @route DELETE /trip-purposes/:id
 */
const deleteTripPurpose = catchAsync(async (req, res) => {
  await tripPurposeService.deleteTripPurpose(req.params.id, req.user._id);
  const statusCode = status.OK;
  res.status(statusCode).send();
});

module.exports = {
  getTripPurposes,
  getTripPurpose,
  createTripPurpose,
  updateTripPurpose,
  deleteTripPurpose,
}; 