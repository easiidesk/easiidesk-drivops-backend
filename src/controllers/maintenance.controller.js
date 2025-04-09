const {status} = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { maintenanceService } = require('../services');
const ApiError = require('../utils/ApiError');

/**
 * Create a new maintenance record
 */
const createMaintenance = catchAsync(async (req, res) => {
  const maintenance = await maintenanceService.createMaintenance(req.body, req.user._id);
  res.status(status.CREATED).send(maintenance);
});

/**
 * Get maintenance record by id
 */
const getMaintenance = catchAsync(async (req, res) => {
  const maintenance = await maintenanceService.getMaintenanceById(req.params.maintenanceId);
  res.send(maintenance);
});

/**
 * Get all maintenance records with pagination
 */
const getAllMaintenance = catchAsync(async (req, res) => {
  const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
  const options = req.query.options ? JSON.parse(req.query.options) : {};
  const result = await maintenanceService.getAllMaintenance(filter, options);
  res.send(result);
});

/**
 * Get maintenance records by vehicle id
 */
const getMaintenanceByVehicle = catchAsync(async (req, res) => {
  const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
  const options = req.query.options ? JSON.parse(req.query.options) : {};
  const result = await maintenanceService.getMaintenanceByVehicle(req.params.vehicleId, filter, options);
  res.send(result);
});

/**
 * Update maintenance record
 */
const updateMaintenance = catchAsync(async (req, res) => {
  const maintenance = await maintenanceService.updateMaintenance(
    req.params.maintenanceId,
    req.body,
    req.user._id
  );
  res.send(maintenance);
});

/**
 * Update maintenance status
 */
const updateMaintenanceStatus = catchAsync(async (req, res) => {
  if (!req.body.status) {
    throw new ApiError(status.BAD_REQUEST, 'Status is required');
  }
  
  const maintenance = await maintenanceService.updateMaintenanceStatus(
    req.params.maintenanceId,
    req.body.status,
    req.user._id
  );
  res.send(maintenance);
});

/**
 * Add document to maintenance record
 */
const addMaintenanceDocument = catchAsync(async (req, res) => {
  if (!req.body.document) {
    throw new ApiError(status.BAD_REQUEST, 'Document data is required');
  }
  
  const maintenance = await maintenanceService.addMaintenanceDocument(
    req.params.maintenanceId,
    req.body.document,
    req.user._id
  );
  res.send(maintenance);
});

/**
 * Delete maintenance record
 */
const deleteMaintenance = catchAsync(async (req, res) => {
  await maintenanceService.deleteMaintenance(req.params.maintenanceId);
  res.status(status.NO_CONTENT).send();
});

/**
 * Query maintenance records
 */
const queryMaintenance = catchAsync(async (req, res) => {
  const options = req.query.options ? JSON.parse(req.query.options) : {};
  const result = await maintenanceService.queryMaintenance(req.query, options);
  res.send(result);
});

module.exports = {
  createMaintenance,
  getMaintenance,
  getAllMaintenance,
  getMaintenanceByVehicle,
  updateMaintenance,
  updateMaintenanceStatus,
  addMaintenanceDocument,
  deleteMaintenance,
  queryMaintenance,
}; 