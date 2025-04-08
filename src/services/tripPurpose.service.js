const { TripPurpose } = require('../models');

/**
 * Get all trip purposes
 * @param {Object} filter - Mongoose filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getTripPurposes = async (filter = {}, options = {}) => {
  // Ensure we only get active and non-deleted trip purposes by default
  const finalFilter = { 
    ...filter, 
    isActive: filter.isActive !== false, 
    deletedAt: null
  };
  
  return TripPurpose.paginate(finalFilter, options);
};

/**
 * Get trip purpose by id
 * @param {ObjectId} id - Trip purpose id
 * @returns {Promise<TripPurpose>}
 */
const getTripPurposeById = async (id) => {
  return TripPurpose.findOne({ _id: id, deletedAt: null });
};

/**
 * Create trip purpose
 * @param {Object} tripPurposeData
 * @returns {Promise<TripPurpose>}
 */
const createTripPurpose = async (tripPurposeData) => {
  // Check if trip purpose with the same name already exists
  const existingTripPurpose = await TripPurpose.findOne({ 
    name: tripPurposeData.name,
    deletedAt: null
  });
  
  if (existingTripPurpose) {
    throw new Error('Trip purpose with this name already exists');
  }
  
  return TripPurpose.create(tripPurposeData);
};

/**
 * Update trip purpose by id
 * @param {ObjectId} tripPurposeId
 * @param {Object} updateBody
 * @returns {Promise<TripPurpose>}
 */
const updateTripPurpose = async (tripPurposeId, updateBody) => {
  const tripPurpose = await getTripPurposeById(tripPurposeId);
  if (!tripPurpose) {
    throw new Error('Trip purpose not found');
  }
  
  // Check if there's a name change and it conflicts with an existing trip purpose
  if (updateBody.name && updateBody.name !== tripPurpose.name) {
    const nameExists = await TripPurpose.findOne({
      name: updateBody.name,
      _id: { $ne: tripPurposeId },
      deletedAt: null
    });
    
    if (nameExists) {
      throw new Error('Trip purpose with this name already exists');
    }
  }
  
  Object.assign(tripPurpose, updateBody);
  await tripPurpose.save();
  return tripPurpose;
};

/**
 * Delete trip purpose by id (soft delete)
 * @param {ObjectId} tripPurposeId
 * @param {ObjectId} userId - ID of user performing the deletion
 * @returns {Promise<TripPurpose>}
 */
const deleteTripPurpose = async (tripPurposeId, userId) => {
  const tripPurpose = await getTripPurposeById(tripPurposeId);
  if (!tripPurpose) {
    throw new Error('Trip purpose not found');
  }
  
  tripPurpose.isActive = false;
  tripPurpose.deletedAt = new Date();
  tripPurpose.deletedBy = userId;
  
  await tripPurpose.save();
  return tripPurpose;
};

module.exports = {
  getTripPurposes,
  getTripPurposeById,
  createTripPurpose,
  updateTripPurpose,
  deleteTripPurpose
}; 