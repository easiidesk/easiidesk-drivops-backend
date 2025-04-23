/**
 * Maintenance Record Controller
 * Handles vehicle maintenance record related operations
 */
const maintenanceRecordService = require('../services/maintenanceRecord.service');
const catchAsync = require('../utils/catchAsync');

/**
 * Create a new maintenance record
 * @route POST /api/maintenance-records
 * @access Private - Driver
 */
const createMaintenanceRecord = catchAsync(async (req, res) => {
  // Only drivers can create maintenance records
  if (req.user.role !== 'driver') {
    return res.status(403).json({
      success: false,
      message: 'Only drivers can create maintenance records'
    });
  }
  
  // Add the current user as requestedBy
  const recordData = {
    ...req.body,
    requestedBy: req.user._id
  };
  
  const maintenanceRecord = await maintenanceRecordService.createMaintenanceRecord(recordData);
  
  return res.status(201).json({
    success: true,
    message: 'Maintenance request created successfully',
    data: maintenanceRecord
  });
});

/**
 * Get all maintenance records (admin only)
 * @route GET /api/maintenance-records
 * @access Private - Admin, Super Admin
 */
const getAllMaintenanceRecords = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, vehicleId, status, startDate, endDate } = req.query;
  
  // Build filter based on query params
  const filter = {};
  
  if (vehicleId) {
    filter.vehicleId = vehicleId;
  }
  
  if (status) {
    filter.status = status;
  }
  
  // Date range filter on requestedAt
  if (startDate || endDate) {
    filter.requestedAt = {};
    if (startDate) {
      filter.requestedAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.requestedAt.$lte = new Date(endDate);
    }
  }
  
  const maintenanceRecords = await maintenanceRecordService.getAllMaintenanceRecords(
    filter,
    {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'requestedAt:desc'
    }
  );
  
  return res.json({
    success: true,
    data: maintenanceRecords
  });
});

/**
 * Get maintenance records for a specific vehicle
 * @route GET /api/maintenance-records/vehicle/:vehicleId
 * @access Private - Admin, Super Admin
 */
const getVehicleMaintenanceRecords = catchAsync(async (req, res) => {
  const { vehicleId } = req.params;
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;
  
  // Build options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy: 'requestedAt:desc'
  };
  
  // Add filters
  let filter = {};
  
  if (status) {
    filter.status = status;
  }
  
  // Date range filter
  if (startDate || endDate) {
    filter.requestedAt = {};
    if (startDate) {
      filter.requestedAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.requestedAt.$lte = new Date(endDate);
    }
  }
  
  const maintenanceRecords = await maintenanceRecordService.getVehicleMaintenanceRecords(vehicleId, options);
  
  return res.json({
    success: true,
    data: maintenanceRecords
  });
});

/**
 * Get my maintenance records (records created by the current user)
 * @route GET /api/maintenance-records/my-records
 * @access Private - Driver
 */
const getMyMaintenanceRecords = catchAsync(async (req, res) => {
  // Only drivers can access their maintenance records
  if (req.user.role !== 'driver') {
    return res.status(403).json({
      success: false,
      message: 'Only drivers can access their maintenance records'
    });
  }
  
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;
  
  // Build options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy: 'requestedAt:desc'
  };
  
  // Add filters
  let filter = {};
  
  if (status) {
    filter.status = status;
  }
  
  // Date range filter
  if (startDate || endDate) {
    filter.requestedAt = {};
    if (startDate) {
      filter.requestedAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.requestedAt.$lte = new Date(endDate);
    }
  }
  
  const maintenanceRecords = await maintenanceRecordService.getUserMaintenanceRecords(req.user._id, options);
  
  return res.json({
    success: true,
    data: maintenanceRecords
  });
});

/**
 * Get maintenance record by ID
 * @route GET /api/maintenance-records/:id
 * @access Private - Admin, Super Admin, or record creator
 */
const getMaintenanceRecordById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const record = await maintenanceRecordService.getMaintenanceRecordById(id);
  
  // Check if user has access to this record
  const isAdmin = ['admin', 'super-admin'].includes(req.user.role);
  const isCreator = record.requestedBy._id.toString() === req.user._id.toString();
  
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
 * Update maintenance record
 * @route PUT /api/maintenance-records/:id
 * @access Private - Admin, Super Admin for approvals, creator for updates to pending records
 */
const updateMaintenanceRecord = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = {
    id: req.user._id,
    role: req.user.role
  };
  
  const updatedRecord = await maintenanceRecordService.updateMaintenanceRecord(id, req.body, user);
  
  return res.json({
    success: true,
    message: 'Maintenance record updated successfully',
    data: updatedRecord
  });
});

/**
 * Approve or reject a maintenance record
 * @route PATCH /api/maintenance-records/:id/approval
 * @access Private - Admin, Super Admin
 */
const approveOrRejectMaintenanceRecord = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  // Only admins can approve/reject
  if (!['admin', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can approve or reject maintenance requests'
    });
  }
  
  // Validate status
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be either "approved" or "rejected"'
    });
  }
  
  const user = {
    id: req.user._id,
    role: req.user.role
  };
  
  const updatedRecord = await maintenanceRecordService.updateMaintenanceRecord(
    id, 
    { status, notes, approvedBy: req.user._id, approvedAt: new Date() },
    user
  );
  
  const action = status === 'approved' ? 'approved' : 'rejected';
  
  return res.json({
    success: true,
    message: `Maintenance request ${action} successfully`,
    data: updatedRecord
  });
});

/**
 * Mark maintenance as completed
 * @route PATCH /api/maintenance-records/:id/complete
 * @access Private - Admin, Super Admin
 */
const completeMaintenanceRecord = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  
  // Only admins can mark as completed
  if (!['admin', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can mark maintenance as completed'
    });
  }
  
  const user = {
    id: req.user._id,
    role: req.user.role
  };
  
  const updatedRecord = await maintenanceRecordService.updateMaintenanceRecord(
    id, 
    { status: 'completed', notes, completedAt: new Date() },
    user
  );
  
  return res.json({
    success: true,
    message: 'Maintenance marked as completed successfully',
    data: updatedRecord
  });
});

/**
 * Delete maintenance record (soft delete)
 * @route DELETE /api/maintenance-records/:id
 * @access Private - Admin, Super Admin, or driver who created a pending record
 */
const deleteMaintenanceRecord = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const user = {
    id: req.user._id,
    role: req.user.role
  };
  
  await maintenanceRecordService.deleteMaintenanceRecord(id, user);
  
  return res.json({
    success: true,
    message: 'Maintenance record deleted successfully'
  });
});

module.exports = {
  createMaintenanceRecord,
  getAllMaintenanceRecords,
  getVehicleMaintenanceRecords,
  getMyMaintenanceRecords,
  getMaintenanceRecordById,
  updateMaintenanceRecord,
  approveOrRejectMaintenanceRecord,
  completeMaintenanceRecord,
  deleteMaintenanceRecord
}; 