const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics and information
 */

/**
 * @swagger
 * /dashboard/counts:
 *   get:
 *     summary: Get dashboard counts
 *     description: Retrieve counts for active trips, pending requests, drivers on duty, and available vehicles.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeTrips:
 *                   type: integer
 *                 pendingRequests:
 *                   type: integer
 *                 driversOnDuty:
 *                   type: integer
 *                 availableVehicles:
 *                   type: integer
 *                 totalActiveVehicles:
 *                   type: integer
 *                 maintenanceVehicles:
 *                   type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/counts', dashboardController.getDashboardCounts);

module.exports = router; 