const httpStatus = require('http-status');
const { Maintenance } = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');

/**
 * Create a maintenance record
 * @param {Object} maintenanceBody
 * @param {ObjectId} userId - User ID creating the record
 * @returns {Promise<Maintenance>}
 */
const createMaintenance = async (maintenanceBody, userId) => {
  const maintenanceData = {
    ...maintenanceBody,
    createdBy: userId
  };
  
  return Maintenance.create(maintenanceData);
};

/**
 * Get maintenance record by id
 * @param {ObjectId} id
 * @returns {Promise<Maintenance>}
 */
const getMaintenanceById = async (id) => {
  const maintenance = await Maintenance.findById(id)
    .populate('vehicle', 'make model year vin')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
  
  if (!maintenance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Maintenance record not found');
  }
  return maintenance;
};

/**
 * Get maintenance records by vehicle ID
 * @param {ObjectId} vehicleId
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getMaintenanceByVehicle = async (vehicleId, filter = {}, options = {}) => {
  const filters = { vehicle: vehicleId, ...filter };
  const pagination = getPagination(options);
  
  return Maintenance.paginate(filters, {
    ...pagination,
    populate: [
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' }
    ],
    sort: { createdAt: -1 }
  });
};

/**
 * Get all maintenance records with pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getAllMaintenance = async (filter = {}, options = {}) => {
  const pagination = getPagination(options);
  
  return Maintenance.paginate(filter, {
    ...pagination,
    populate: [
      { path: 'vehicle', select: 'make model year vin' },
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' }
    ],
    sort: { createdAt: -1 }
  });
};

/**
 * Update maintenance record by id
 * @param {ObjectId} maintenanceId
 * @param {Object} updateBody
 * @param {ObjectId} userId - User ID updating the record
 * @returns {Promise<Maintenance>}
 */
const updateMaintenance = async (maintenanceId, updateBody, userId) => {
  const maintenance = await getMaintenanceById(maintenanceId);
  
  // Don't allow updating certain fields directly
  const safeUpdateBody = { ...updateBody };
  delete safeUpdateBody.createdBy;
  delete safeUpdateBody.createdAt;
  
  // Add updatedBy field
  safeUpdateBody.updatedBy = userId;
  
  Object.assign(maintenance, safeUpdateBody);
  await maintenance.save();
  return maintenance;
};

/**
 * Update maintenance status
 * @param {ObjectId} maintenanceId
 * @param {string} status
 * @param {ObjectId} userId - User ID updating the status
 * @returns {Promise<Maintenance>}
 */
const updateMaintenanceStatus = async (maintenanceId, status, userId) => {
  const maintenance = await getMaintenanceById(maintenanceId);
  
  maintenance.status = status;
  maintenance.updatedBy = userId;
  
  // If status is completed, set the endDate to now if not already set
  if (status === 'completed' && !maintenance.endDate) {
    maintenance.endDate = new Date();
    
    // Calculate duration if startDate exists
    if (maintenance.startDate) {
      const durationMs = maintenance.endDate - maintenance.startDate;
      maintenance.duration = Math.round(durationMs / (1000 * 60 * 60)); // duration in hours
    }
  }
  
  // If status is in-progress, set the startDate to now if not already set
  if (status === 'in-progress' && !maintenance.startDate) {
    maintenance.startDate = new Date();
  }
  
  await maintenance.save();
  return maintenance;
};

/**
 * Add document to maintenance record
 * @param {ObjectId} maintenanceId
 * @param {Object} document
 * @param {ObjectId} userId - User ID adding the document
 * @returns {Promise<Maintenance>}
 */
const addMaintenanceDocument = async (maintenanceId, document, userId) => {
  const maintenance = await getMaintenanceById(maintenanceId);
  
  const newDocument = {
    ...document,
    uploadedAt: new Date(),
    uploadedBy: userId
  };
  
  maintenance.documents.push(newDocument);
  maintenance.updatedBy = userId;
  
  await maintenance.save();
  return maintenance;
};

/**
 * Delete maintenance record
 * @param {ObjectId} maintenanceId
 * @returns {Promise<Maintenance>}
 */
const deleteMaintenance = async (maintenanceId) => {
  const maintenance = await getMaintenanceById(maintenanceId);
  await maintenance.remove();
  return maintenance;
};

/**
 * Get maintenance records by query
 * @param {Object} query - Query object for filtering
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryMaintenance = async (query, options) => {
  const pagination = getPagination(options);
  
  // Handle text search if provided
  if (query.search) {
    return Maintenance.paginate(
      { $text: { $search: query.search } },
      {
        ...pagination,
        populate: [
          { path: 'vehicle', select: 'make model year vin' },
          { path: 'createdBy', select: 'name email' },
          { path: 'updatedBy', select: 'name email' }
        ],
        sort: { score: { $meta: 'textScore' } }
      }
    );
  }
  
  // Build the filter object based on query parameters
  const filter = {};
  
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.vehicle) filter.vehicle = query.vehicle;
  
  // Date range filters
  if (query.startDate || query.endDate) {
    filter.scheduledDate = {};
    if (query.startDate) filter.scheduledDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.scheduledDate.$lte = new Date(query.endDate);
  }
  
  return getAllMaintenance(filter, options);
};

module.exports = {
  createMaintenance,
  getMaintenanceById,
  getMaintenanceByVehicle,
  getAllMaintenance,
  updateMaintenance,
  updateMaintenanceStatus,
  addMaintenanceDocument,
  deleteMaintenance,
  queryMaintenance,
}; 