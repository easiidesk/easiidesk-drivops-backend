/**
 * Driver Attendance Routes
 * Defines routes for driver attendance operations
 */
const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth.middleware');
const { validateRequest, validateParams } = require('../middleware/validate.middleware');
const driverAttendanceController = require('../controllers/driverAttendance.controller');
const { driverIdParamSchema, dateRangeSchema } = require('../validators/driverAttendance.validator');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /driver-attendance/status:
 *   get:
 *     summary: Get current punch status for driver
 *     tags: [Driver Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver's current punch status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Driver not found
 */
router.get('/status', authorize(['driver']), driverAttendanceController.getPunchStatus);

/**
 * @swagger
 * /driver-attendance/punch-in:
 *   post:
 *     summary: Punch in
 *     tags: [Driver Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Successfully punched in
 *       400:
 *         description: Already punched in
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Driver not found
 */
router.post('/punch-in', authorize(['driver']), driverAttendanceController.punchIn);

/**
 * @swagger
 * /driver-attendance/punch-out:
 *   post:
 *     summary: Punch out
 *     tags: [Driver Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully punched out
 *       400:
 *         description: No active punch-in found or already punched out
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Driver not found
 */
router.post('/punch-out', authorize(['driver']), driverAttendanceController.punchOut);

/**
 * @swagger
 * /driver-attendance/punched-in-count:
 *   get:
 *     summary: Get count of drivers currently punched in
 *     tags: [Driver Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count of drivers currently punched in with driver details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         punchedInCount:
 *                           type: number
 *                           description: Number of drivers currently punched in
 *                           example: 5
 *                         totalDrivers:
 *                           type: number
 *                           description: Total number of active drivers
 *                           example: 10
 *                         punchedInTodayCount:
 *                           type: number
 *                           description: Number of drivers who punched in today (including those who have punched out)
 *                           example: 7
 *                     punchedInDrivers:
 *                       type: array
 *                       description: List of drivers who are currently punched in
 *                       items:
 *                         type: object
 *                         properties:
 *                           driverId:
 *                             type: string
 *                             description: Driver ID
 *                             example: "507f1f77bcf86cd799439011"
 *                           name:
 *                             type: string
 *                             description: Driver name
 *                             example: "John Doe"
 *                           phone:
 *                             type: string
 *                             description: Driver phone number
 *                             example: "+1234567890"
 *                           punchInTime:
 *                             type: string
 *                             format: date-time
 *                             description: Time when the driver punched in
 *                             example: "2023-03-15T08:30:00.000Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get('/punched-in-count', 
  authorize(['requestor','scheduler', 'admin', 'super-admin']), 
  driverAttendanceController.getPunchedInDriversCount
);

/**
 * @swagger
 * /driver-attendance:
 *   get:
 *     summary: Get all driver attendance records
 *     tags: [Driver Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *         description: Filter by driver ID
 *     responses:
 *       200:
 *         description: List of attendance records
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get('/', authorize(['scheduler', 'admin', 'super-admin']), driverAttendanceController.getAllDriverAttendance);

/**
 * @swagger
 * /driver-attendance/history:
 *   get:
 *     summary: Get driver's own attendance history
 *     tags: [Driver Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Driver's attendance history
 *       401:
 *         description: Unauthorized
 */
router.get('/history', authorize(['driver']), validateRequest(dateRangeSchema), driverAttendanceController.getAttendanceHistory);

/**
 * @swagger
 * /driver-attendance/{driverId}/history:
 *   get:
 *     summary: Get attendance history for a specific driver (admin endpoint)
 *     tags: [Driver Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Driver's attendance history
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Driver not found
 */
router.get('/:driverId/history', 
  authorize(['scheduler', 'admin', 'super-admin']), 
  validateParams(driverIdParamSchema),
  validateRequest(dateRangeSchema),
  driverAttendanceController.getDriverAttendanceHistory
);

module.exports = router; 