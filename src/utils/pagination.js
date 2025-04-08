/**
 * Get pagination options from request query params
 * @param {Object} options - Query options containing page and limit
 * @returns {Object} Pagination options with skip and limit
 */
const getPagination = (options = {}) => {
  // Check if pagination should be disabled
  // Pagination is disabled if limit is 0, "0", null, undefined, or the string "all"
  const disablePagination = 
    options.limit === 0 || 
    options.limit === "0" || 
    options.limit === null || 
    options.limit === undefined || 
    options.limit === "all";

  if (disablePagination) {
    return {
      pagination: false,
      page: 1
    };
  }

  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;

  return {
    skip,
    limit,
    page,
    pagination: true
  };
};

module.exports = {
  getPagination
}; 