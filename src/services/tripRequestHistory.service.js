const { TripRequestHistory } = require('../models');
const { getPagination } = require('../utils/pagination');

/**
 * Create a trip request history entry
 * @param {Object} historyData
 * @returns {Promise<TripRequestHistory>}
 */
const createHistory = async (historyData) => {
  return TripRequestHistory.create(historyData);
};

/**
 * Get history entries for a trip request
 * @param {ObjectId} tripRequestId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getTripRequestHistory = async (tripRequestId, options = {}) => {
  const pagination = getPagination(options);
  
  const histories = await TripRequestHistory.find({ tripRequestId })
    .populate('changedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);

  const total = await TripRequestHistory.countDocuments({ tripRequestId });

  return {
    results: histories,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
    totalResults: total
  };
};

module.exports = {
  createHistory,
  getTripRequestHistory
}; 