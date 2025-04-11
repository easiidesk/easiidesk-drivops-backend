const { status } = require('http-status');
const { TripRequest, TripRequestHistory } = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');
const { sendNotificationsToRoles, formatTripRequestNotification } = require('../utils/notifcationHelper');

/**
 * Format trip request data according to required structure
 * @param {Object} tripRequest - Trip request document
 * @returns {Object} Formatted trip request
 */
const formatTripRequest = (tripRequest) => {
  const formatted = {
    _id: tripRequest._id,
    destination: tripRequest.destination,
    mapLink: tripRequest.mapLink,
    dateTime: tripRequest.dateTime,
    purpose: tripRequest.purpose ? {
      id: tripRequest.purpose._id,
      name: tripRequest.purpose.name,
      jobCardNeeded: tripRequest.purpose.jobCardNeeded
    } : null,
    jobCardId: tripRequest.jobCardId,
    noOfPeople: tripRequest.noOfPeople,
    requiredVehicle: tripRequest.requiredVehicle ? tripRequest.requiredVehicle.map(vehicle => ({
      id: vehicle._id,
      name: vehicle.name
    })) : [],
    remarks: tripRequest.remarks,
    createdBy: tripRequest.createdBy ? {
      id: tripRequest.createdBy._id,
      name: tripRequest.createdBy.name,
      phone: tripRequest.createdBy.phone
    } : null,
    status: tripRequest.status,
    createdAt: tripRequest.createdAt,
    modifiedAt: tripRequest.updatedAt,
    deletedAt: tripRequest.deletedAt,
    deletedBy: tripRequest.deletedBy,
    linkedTripId: tripRequest.linkedTripId?._id || null,
    cancelRemarks: tripRequest.cancelRemarks || null,
    tripSchedule: tripRequest.linkedTripId ? {
      id: tripRequest.linkedTripId._id,
      tripStartTime: tripRequest.linkedTripId.tripStartTime,
      tripApproxReturnTime: tripRequest.linkedTripId.tripApproxReturnTime,
      driver: tripRequest.linkedTripId.driverId ? {
        _id: tripRequest.linkedTripId.driverId._id,
        name: tripRequest.linkedTripId.driverId.name,
        email: tripRequest.linkedTripId.driverId.email,
        phone: tripRequest.linkedTripId.driverId.phone,
        role: tripRequest.linkedTripId.driverId.role,
        password: tripRequest.linkedTripId.driverId.password,
        isActive: tripRequest.linkedTripId.driverId.isActive,
        deletedAt: tripRequest.linkedTripId.driverId.deletedAt,
        createdAt: tripRequest.linkedTripId.driverId.createdAt,
        updatedAt: tripRequest.linkedTripId.driverId.updatedAt,
        modifiedAt: tripRequest.linkedTripId.driverId.modifiedAt,
        modifiedBy: tripRequest.linkedTripId.driverId.modifiedBy
      } : null,
      vehicle: tripRequest.linkedTripId.vehicleId ? {
        _id: tripRequest.linkedTripId.vehicleId._id,
        name: tripRequest.linkedTripId.vehicleId.name,
        registrationNumber: tripRequest.linkedTripId.vehicleId.registrationNumber,
        isActive: tripRequest.linkedTripId.vehicleId.isActive,
        createdAt: tripRequest.linkedTripId.vehicleId.createdAt,
        updatedAt: tripRequest.linkedTripId.vehicleId.updatedAt,
        deletedAt: tripRequest.linkedTripId.vehicleId.deletedAt,
        deletedBy: tripRequest.linkedTripId.vehicleId.deletedBy,
        isInMaintenance: tripRequest.linkedTripId.vehicleId.isInMaintenance
      } : null,
      destinations: tripRequest.linkedTripId.destinations ? tripRequest.linkedTripId.destinations.map(dest => ({
        requestId: dest.requestId,
        tripStartTime: dest.tripStartTime,
        tripApproxArrivalTime: dest.tripApproxArrivalTime,
        tripPurposeTime: dest.tripPurposeTime,
        destination: dest.destination
      })) : []
    } : null
  };

  return formatted;
};

/**
 * Get raw trip request document by id (without formatting)
 * @param {ObjectId} id
 * @returns {Promise<TripRequest>}
 * @private
 */
const getRawTripRequestById = async (id) => {
  const tripRequest = await TripRequest.findById(id)
    .populate('purpose', 'name jobCardNeeded')
    .populate('requiredVehicle', 'name')
    .populate('createdBy', 'name phone')
    .populate({
      path: 'linkedTripId',
      populate: [
        {
          path: 'driverId',
          select: 'name email phone role password isActive deletedAt createdAt updatedAt modifiedAt modifiedBy'
        },
        {
          path: 'vehicleId',
          select: 'name registrationNumber isActive createdAt updatedAt deletedAt deletedBy isInMaintenance'
        }
      ]
    });
  
  if (!tripRequest) {
    throw new ApiError(status.NOT_FOUND, 'Trip request not found');
  }
  
  return tripRequest;
};

/**
 * Get trip request by id
 * @param {ObjectId} id
 * @returns {Promise<Object>}
 */
const getTripRequestById = async (id) => {
  const tripRequest = await getRawTripRequestById(id);
  return formatTripRequest(tripRequest);
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
    status: 'pending',
    createdBy: userId
  };
  
  const tripRequest = await TripRequest.create(requestData);
  
  // Create history entry for creation
  await TripRequestHistory.create({
    tripRequestId: tripRequest._id,
    changedBy: userId,
    changeType: 'created',
    previousState: null,
    newState: tripRequest.toObject(),
    remarks: 'Trip request created'
  });

  const tripRequestData = await getTripRequestById(tripRequest._id);

  //notify all schedulers-admins-super-admins
  sendNotificationsToRoles(['scheduler', 'admin', 'super-admin'], ['receiveTripRequestedNotification'], 'New Trip Request', formatTripRequestNotification(tripRequestData), {
    tripRequestId: tripRequest._id.toString()
  });
  

  return tripRequestData;
};

/**
 * Update trip request by id
 * @param {ObjectId} tripRequestId
 * @param {Object} updateBody
 * @param {ObjectId} userId - User ID updating the request
 * @returns {Promise<TripRequest>}
 */
const updateTripRequest = async (tripRequestId, updateBody, userId) => {
  const tripRequest = await getRawTripRequestById(tripRequestId);
  
  // Can't update if the trip is already linked to a schedule
  if (tripRequest.linkedTripId && updateBody.status !== 'cancelled') {
    throw new ApiError(
      status.BAD_REQUEST, 
      'Cannot update a trip request that is already scheduled, except for cancellation'
    );
  }
  
  // Don't allow updating certain fields
  const safeUpdateBody = { ...updateBody };
  delete safeUpdateBody.createdBy;
  delete safeUpdateBody.createdAt;
  
  // Store previous state for history
  const previousState = tripRequest.toObject();
  
  const updated = await TripRequest.findByIdAndUpdate(
    tripRequestId,
    safeUpdateBody,
    { new: true }
  ).populate('purpose', 'name jobCardNeeded')
    .populate('requiredVehicle', 'name')
    .populate('createdBy', 'name phone')
    .populate({
      path: 'linkedTripId',
      populate: [
        {
          path: 'driverId',
          select: 'name email phone role password isActive deletedAt createdAt updatedAt modifiedAt modifiedBy'
        },
        {
          path: 'vehicleId',
          select: 'name registrationNumber isActive createdAt updatedAt deletedAt deletedBy isInMaintenance'
        }
      ]
    });
  
  // Create history entry for update
  const changeType = updateBody.status ? 'status_changed' : 'updated';
  await TripRequestHistory.create({
    tripRequestId: tripRequestId,
    changedBy: userId,
    changeType: changeType,
    previousState: previousState,
    newState: updated.toObject(),
    remarks: updateBody.status 
      ? `Status changed to ${updateBody.status}` 
      : 'Trip request updated'
  });
  
  return formatTripRequest(updated);
};

/**
 * Delete trip request by id
 * @param {ObjectId} tripRequestId
 * @param {ObjectId} userId - User ID deleting the request
 * @returns {Promise<TripRequest>}
 */
const deleteTripRequest = async (tripRequestId, userId) => {
  const tripRequest = await getRawTripRequestById(tripRequestId);
  
  // Can't delete if the trip is already linked to a schedule
  if (tripRequest.linkedTripId) {
    throw new ApiError(
      status.BAD_REQUEST, 
      'Cannot delete a trip request that is already scheduled'
    );
  }
  
  // Store previous state for history
  const previousState = tripRequest.toObject();
  
  // Soft delete
  const updated = await TripRequest.findByIdAndUpdate(
    tripRequestId,
    {
      deletedAt: new Date(),
      deletedBy: userId
    },
    { new: true }
  ).populate('purpose', 'name jobCardNeeded')
    .populate('requiredVehicle', 'name')
    .populate('createdBy', 'name phone')
    .populate({
      path: 'linkedTripId',
      populate: [
        {
          path: 'driverId',
          select: 'name email phone role password isActive deletedAt createdAt updatedAt modifiedAt modifiedBy'
        },
        {
          path: 'vehicleId',
          select: 'name registrationNumber isActive createdAt updatedAt deletedAt deletedBy isInMaintenance'
        }
      ]
    });
  
  // Create history entry for deletion
  await TripRequestHistory.create({
    tripRequestId: tripRequestId,
    changedBy: userId,
    changeType: 'deleted',
    previousState: previousState,
    newState: updated.toObject(),
    remarks: 'Trip request deleted'
  });
  
  return formatTripRequest(updated);
};

/**
 * Get all trip requests with pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getTripRequests = async (filter = {}, options = {}) => {
  const pagination = getPagination(options);
  
  const tripRequests = await TripRequest.find(filter)
    .populate('purpose', 'name jobCardNeeded')
    .populate('requiredVehicle', 'name')
    .populate('createdBy', 'name phone')
    .populate({
      path: 'linkedTripId',
      populate: [
        {
          path: 'driverId',
          select: 'name email phone'
        },
        {
          path: 'vehicleId',
          select: 'name registrationNumber'
        }
      ]
    })
    .sort(options.sortBy ? options.sortBy : { createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  const total = await TripRequest.countDocuments(filter);
  
  const formattedResults = tripRequests.map(formatTripRequest);

  return {
    results: formattedResults,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
    totalResults: total
  };
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
  const updated = await TripRequest.findByIdAndUpdate(
    requestId,
    {
      linkedTripId: scheduleId,
      status: scheduleId ? 'scheduled' : 'pending'
    },
    { new: true }
  );
  
  return getTripRequestById(updated._id);
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