/**
 * Get pagination options from request query params
 * @param {Object} options - Query options containing page and limit
 * @returns {Object} Pagination options with skip and limit
 */
const getPagination = (options = {}) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;

  return {
    skip,
    limit,
    page
  };
};

module.exports = {
  getPagination
}; 