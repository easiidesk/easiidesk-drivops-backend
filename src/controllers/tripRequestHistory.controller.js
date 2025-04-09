const catchAsync = require('../utils/catchAsync');
const { tripRequestHistoryService } = require('../services');

/**
 * Get history for a trip request
 * @route GET /trip-requests/:id/history
 */
const getTripRequestHistory = catchAsync(async (req, res) => {
  const options = {
    sortBy: req.query.sortBy,
    limit: req.query.limit,
    page: req.query.page,
  };
  
  const result = await tripRequestHistoryService.getTripRequestHistory(req.params.id, options);
  
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

module.exports = {
  getTripRequestHistory
}; 