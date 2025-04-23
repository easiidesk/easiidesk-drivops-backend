/**
 * Fueling Record Controller
 * Handles vehicle fueling record related operations
 */
const fuelingRecordService = require('../services/fuelingRecord.service');
const catchAsync = require('../utils/catchAsync');

/**
 * Create a new fueling record
 * @route POST /api/fueling-records
 * @access Private - Any authenticated user
 */
const createFuelingRecord = catchAsync(async (req, res) => {
  // Add the current user as fueledBy
  const recordData = {
    ...req.body,
    fueledBy: req.body.fueledBy?req.body.fueledBy:req.user._id
  };
  
  const fuelingRecord = await fuelingRecordService.createFuelingRecord(recordData, req.user._id);
  
  return res.status(201).json({
    success: true,
    message: 'Fueling record created successfully',
    data: fuelingRecord
  });
});

/**
 * Get all fueling records (admin only)
 * @route GET /api/fueling-records
 * @access Private - Admin, Super Admin
 */
const getAllFuelingRecords = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, vehicleId, startDate, endDate } = req.query;
  
  // Build filter based on query params
  const filter = {};
  
  if (vehicleId) {
    filter.vehicleId = vehicleId;
  }
  
  // Date range filter
  if (startDate || endDate) {
    filter.fueledAt = {};
    if (startDate) {
      filter.fueledAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.fueledAt.$lte = new Date(endDate);
    }
  }
  
  const fuelingRecords = await fuelingRecordService.getAllFuelingRecords(
    filter,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'fueledAt:desc'
    }
  );
  
  return res.json({
    success: true,
    data: fuelingRecords
  });
});

/**
 * Get fueling records for a specific vehicle
 * @route GET /api/fueling-records/vehicle/:vehicleId
 * @access Private - Admin, Super Admin
 */
const getVehicleFuelingRecords = catchAsync(async (req, res) => {
  const { vehicleId } = req.params;
  const { page = 1, limit = 10, startDate, endDate } = req.query;
  
  // Build options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy: 'fueledAt:desc'
  };
  
  // Add date filter if provided
  let filter = {};
  if (startDate || endDate) {
    filter.fueledAt = {};
    if (startDate) {
      filter.fueledAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.fueledAt.$lte = new Date(endDate);
    }
  }
  
  const fuelingRecords = await fuelingRecordService.getVehicleFuelingRecords(vehicleId, options, filter);
  
  return res.json({
    success: true,
    data: fuelingRecords
  });
});

/**
 * Get my fueling records (records created by the current user)
 * @route GET /api/fueling-records/my-records
 * @access Private - Any authenticated user
 */
const getMyFuelingRecords = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, startDate, endDate } = req.query;
  
  // Build options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy: 'fueledAt:desc'
  };
  
  // Add date filter if provided
  let filter = {};
  if (startDate || endDate) {
    filter.fueledAt = {};
    if (startDate) {
      filter.fueledAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.fueledAt.$lte = new Date(endDate);
    }
  }
  
  const fuelingRecords = await fuelingRecordService.getUserFuelingRecords(req.user._id, options, filter);
  
  return res.json({
    success: true,
    data: fuelingRecords
  });
});

/**
 * Get fueling record by ID
 * @route GET /api/fueling-records/:id
 * @access Private - Admin, Super Admin, or record creator
 */
const getFuelingRecordById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const record = await fuelingRecordService.getFuelingRecordById(id);
  
  // Check if user has access to this record
  const isAdmin = ['admin', 'super-admin'].includes(req.user.role);
  const isCreator = record.fueledBy._id.toString() === req.user._id.toString();
  
  if (!isAdmin && !isCreator) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this record'
    });
  }
  
  return res.json({
    success: true,
    data: record
  });
});

/**
 * Update fueling record
 * @route PUT /api/fueling-records/:id
 * @access Private - Admin, Super Admin, or record creator
 */
const updateFuelingRecord = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body, userRole: req.user.role };
  
  const updatedRecord = await fuelingRecordService.updateFuelingRecord(id, updateData, req.user._id);
  
  return res.json({
    success: true,
    message: 'Fueling record updated successfully',
    data: updatedRecord
  });
});

/**
 * Delete fueling record (soft delete)
 * @route DELETE /api/fueling-records/:id
 * @access Private - Admin, Super Admin
 */
const deleteFuelingRecord = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Only allow admins to delete records
  if (!['admin', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to delete fueling records'
    });
  }
  
  await fuelingRecordService.deleteFuelingRecord(id, req.user._id);
  
  return res.json({
    success: true,
    message: 'Fueling record deleted successfully'
  });
});

module.exports = {
  createFuelingRecord,
  getAllFuelingRecords,
  getVehicleFuelingRecords,
  getMyFuelingRecords,
  getFuelingRecordById,
  updateFuelingRecord,
  deleteFuelingRecord
}; 