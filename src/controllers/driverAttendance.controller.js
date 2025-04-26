/**
 * Driver Attendance Controller
 * Handles driver attendance related operations like punch in, punch out, and status
 */
const driverAttendanceService = require('../services/driverAttendance.service');
const catchAsync = require('../utils/catchAsync');

/**
 * Get the current punch status for a driver
 * @route GET /api/driver-attendance/status
 * @access Private - Driver
 */
const getPunchStatus = catchAsync(async (req, res) => {
  const status = await driverAttendanceService.getDriverPunchStatus(req.user._id);
  return res.json(status);
});

/**
 * Punch in a driver
 * @route POST /api/driver-attendance/punch-in
 * @access Private - Driver
 */
const punchIn = catchAsync(async (req, res) => {
  // Extract location data if provided
  const punchData = {};
  if (req.body.coordinates) {
    punchData.coordinates = req.body.coordinates;
  }
  
  const result = await driverAttendanceService.punchIn(req.user._id, punchData);
  return res.status(201).json({
    success: true,
    message: 'Punched in successfully',
    data: result
  });
});

/**
 * Punch out a driver
 * @route POST /api/driver-attendance/punch-out
 * @access Private - Driver
 */
const punchOut = catchAsync(async (req, res) => {
  // Extract location data if provided
  const punchData = {};
  if (req.body.coordinates) {
    punchData.coordinates = req.body.coordinates;
  }
  
  const result = await driverAttendanceService.punchOut(req.user._id, punchData);
  return res.status(200).json({
    success: true,
    message: 'Punched out successfully',
    data: result
  });
});

/**
 * Get count of drivers who are currently punched in
 * @route GET /api/driver-attendance/punched-in-count
 * @access Private - Admin, Super Admin, Scheduler, Requestor
 */
const getPunchedInDriversCount = catchAsync(async (req, res) => {
  const countData = await driverAttendanceService.getPunchedInDriversCount(req.user.role);
  
  // Format the response with a more descriptive structure
  return res.json({
    success: true,
    data: {
      summary: {
        punchedInCount: countData.punchedInCount,
        totalDrivers: countData.totalDrivers,
        punchedInTodayCount: countData.punchedInTodayCount
      },
      punchedInDrivers: countData.punchedInDrivers
    }
  });
});

/**
 * Get all driver attendance records
 * @route GET /api/driver-attendance
 * @access Private - Admin, Super Admin
 */
const getAllDriverAttendance = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, date, driverId } = req.query;
  const attendance = await driverAttendanceService.getAllDriverAttendance({ 
    page: parseInt(page), 
    limit: parseInt(limit), 
    date, 
    driverId 
  });
  return res.json(attendance);
});

/**
 * Get attendance history for a driver
 * @route GET /api/driver-attendance/history
 * @access Private - Driver
 */
const getAttendanceHistory = catchAsync(async (req, res) => {
  const { startDate, endDate, page = 1, limit = 10 } = req.query;
  const history = await driverAttendanceService.getDriverAttendanceHistory(
    req.user._id,
    {
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  );
  return res.json(history);
});

/**
 * Get attendance history for a specific driver (admin endpoint)
 * @route GET /api/driver-attendance/:driverId/history
 * @access Private - Admin, Super Admin
 */
const getDriverAttendanceHistory = catchAsync(async (req, res) => {
  const { driverId } = req.params;
  const { startDate, endDate, page = 1, limit = 10 } = req.query;
  const history = await driverAttendanceService.getDriverAttendanceHistory(
    driverId,
    {
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  );
  return res.json(history);
});

/**
 * Get drivers who are punched in but not assigned to any active trips
 * @route GET /api/driver-attendance/idle-drivers
 * @access Private - Admin, Super Admin
 */
const getIdleDrivers = catchAsync(async (req, res) => {
  const idleDrivers = await driverAttendanceService.getIdleDrivers(req.user.role);
  
  return res.json(idleDrivers);
});

module.exports = {
  getPunchStatus,
  punchIn,
  punchOut,
  getPunchedInDriversCount,
  getAllDriverAttendance,
  getAttendanceHistory,
  getDriverAttendanceHistory,
  getIdleDrivers
}; 