const catchAsync = require('../utils/catchAsync');
const { dashboardService } = require('../services');

/**
 * Get dashboard counts
 * @route GET /dashboard/counts
 */
const getDashboardCounts = catchAsync(async (req, res) => {
  const counts = await dashboardService.getDashboardCounts(req.user.role);
  res.send(counts);
});

module.exports = {
  getDashboardCounts,
}; 