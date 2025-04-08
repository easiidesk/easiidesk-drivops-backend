const httpStatus = require('http-status');
const { TripRequest } = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');

/**
 * Get all trip requests with pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getTripRequests = async (filter = {}, options = {}) => {
  const pagination = getPagination(options);
  
  return TripRequest.paginate(filter, {
    ...pagination,
    populate: [
      { path: 'createdBy', select: 'name email phone' },
      { path: 'requiredVehicle', select: 'name licensePlate' },
      { path: 'linkedTrip', select: 'driverId vehicleId destinations' }
    ],
    sort: options.sortBy ? options.sortBy : { createdAt: -1 }
  });
};

/**
 * Get trip request by id
 * @param {ObjectId} id
 * @returns {Promise<TripRequest>}
 */
const getTripRequestById = async (id) => {
  const tripRequest = await TripRequest.findById(id)
    .populate('createdBy', 'name email phone')
    .populate('requiredVehicle', 'name licensePlate')
    .populate('linkedTrip');
  
  if (!tripRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Trip request not found');
  }
  
  return tripRequest;
};

/**
 * Create a trip request
 * @param {Object} requestBody
 * @param {ObjectId} userId - User ID creating the request
 * @returns {Promise<TripRequest>}
 */
const createTripRequest = async (requestBody, userId) => {
  // Prepare data with user ID
  const requestData = {
    ...requestBody,
    createdBy: userId
  };
  
  return TripRequest.create(requestData);
};

/**
 * Update trip request by id
 * @param {ObjectId} tripRequestId
 * @param {Object} updateBody
 * @returns {Promise<TripRequest>}
 */
const updateTripRequest = async (tripRequestId, updateBody) => {
  const tripRequest = await getTripRequestById(tripRequestId);
  
  // Can't update if the trip is already linked to a schedule
  if (tripRequest.linkedTrip && updateBody.status !== 'cancelled') {
    throw new ApiError(
      httpStatus.BAD_REQUEST, 
      'Cannot update a trip request that is already scheduled, except for cancellation'
    );
  }
  
  // Don't allow updating certain fields
  const safeUpdateBody = { ...updateBody };
  delete safeUpdateBody.createdBy;
  delete safeUpdateBody.createdAt;
  
  Object.assign(tripRequest, safeUpdateBody);
  await tripRequest.save();
  return tripRequest;
};

/**
 * Delete trip request by id
 * @param {ObjectId} tripRequestId
 * @param {ObjectId} userId - User ID deleting the request
 * @returns {Promise<TripRequest>}
 */
const deleteTripRequest = async (tripRequestId, userId) => {
  const tripRequest = await getTripRequestById(tripRequestId);
  
  // Can't delete if the trip is already linked to a schedule
  if (tripRequest.linkedTrip) {
    throw new ApiError(
      httpStatus.BAD_REQUEST, 
      'Cannot delete a trip request that is already scheduled'
    );
  }
  
  // Soft delete
  tripRequest.deletedAt = new Date();
  tripRequest.deletedBy = userId;
  await tripRequest.save();
  
  return tripRequest;
};

/**
 * Get trip requests by user ID
 * @param {ObjectId} userId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getTripRequestsByUser = async (userId, options = {}) => {
  const filter = { createdBy: userId, deletedAt: null };
  return getTripRequests(filter, options);
};

/**
 * Update request status (linked/unlinked from schedule)
 * @param {ObjectId} requestId 
 * @param {ObjectId} scheduleId - Schedule ID or null to unlink
 * @returns {Promise<TripRequest>}
 */
const updateRequestLinkStatus = async (requestId, scheduleId) => {
  const tripRequest = await getTripRequestById(requestId);
  
  tripRequest.linkedTrip = scheduleId;
  tripRequest.status = scheduleId ? 'scheduled' : 'pending';
  
  await tripRequest.save();
  return tripRequest;
};

module.exports = {
  getTripRequests,
  getTripRequestById,
  createTripRequest,
  updateTripRequest,
  deleteTripRequest,
  getTripRequestsByUser,
  updateRequestLinkStatus
}; 