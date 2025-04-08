/**
 * A mongoose schema plugin that adds paginate method to the schema
 */

const paginate = (schema) => {
  /**
   * @typedef {Object} QueryResult
   * @property {Document[]} results - Results found
   * @property {number} page - Current page
   * @property {number} limit - Maximum number of results per page
   * @property {number} totalPages - Total number of pages
   * @property {number} totalResults - Total number of documents
   */
  /**
   * Query for documents with pagination
   * @param {Object} [filter] - Mongo filter
   * @param {Object} [options] - Query options
   * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
   * @param {number} [options.limit] - Maximum number of results per page (default = 10)
   * @param {number} [options.page] - Current page (default = 1)
   * @param {string} [options.populate] - Paths to populate
   * @param {boolean} [options.pagination] - Whether to use pagination (default = true)
   * @returns {Promise<QueryResult>}
   */
  schema.statics.paginate = async function (filter, options = {}) {
    let sort = {};
    if (options.sortBy) {
      const parts = options.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      // Default sort by createdAt descending
      sort = { createdAt: -1 };
    }

    // Check if pagination is explicitly disabled or if limit is set to 0 or not provided
    const usePagination = options.pagination !== false && 
                         (options.limit !== undefined && 
                          options.limit !== null && 
                          parseInt(options.limit, 10) !== 0);

    // Get count for total results
    const totalResults = await this.countDocuments(filter).exec();
    
    // Build base query
    let docsPromise = this.find(filter).sort(sort);

    let page = 1;
    let limit = totalResults; // Default to all results
    let totalPages = 1;

    // Apply pagination if enabled
    if (usePagination) {
      limit = parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
      page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
      const skip = (page - 1) * limit;
      
      docsPromise = docsPromise.skip(skip).limit(limit);
      totalPages = Math.ceil(totalResults / limit);
    }

    // Handle population if requested
    if (options.populate) {
      options.populate.forEach((field) => {
        docsPromise = docsPromise.populate(field);
      });
    }

    // Execute query
    const results = await docsPromise.exec();

    // Return results with pagination metadata
    return {
      results,
      page,
      limit,
      totalPages,
      totalResults,
    };
  };
};

module.exports = paginate; 