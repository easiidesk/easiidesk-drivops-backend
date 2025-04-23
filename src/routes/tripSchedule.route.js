const express = require('express');
const { validateRequest, validateParams, validateQuery } = require('../middleware/validate.middleware');
const tripScheduleController = require('../controllers/tripSchedule.controller');
const tripScheduleValidation = require('../validators/tripSchedule.validator');
const { verifyToken, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Trip Schedules
 *   description: Trip schedule management
 */

/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: Get all trip schedules
 *     description: Retrieve trip schedules with filters and pagination.
 *     tags: [Trip Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *         description: Filter by driver ID
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *         description: Filter by vehicle ID 
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date from (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date to (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of items per page
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TripSchedule'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', authorize(['scheduler','admin', 'super-admin']), validateQuery(tripScheduleValidation.getSchedules), tripScheduleController.getSchedules);

/**
 * @swagger
 * /schedules/{id}:
 *   get:
 *     summary: Get a trip schedule
 *     description: Get trip schedule by ID
 *     tags: [Trip Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip schedule ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripSchedule'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authorize(['scheduler','admin', 'super-admin']), validateParams(tripScheduleValidation.getSchedule), tripScheduleController.getSchedule);

/**
 * @swagger
 * /schedules:
 *   post:
 *     summary: Create a trip schedule
 *     description: Create a new trip schedule.
 *     tags: [Trip Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TripScheduleCreate'
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripSchedule'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', authorize(['scheduler','admin', 'super-admin']), validateRequest(tripScheduleValidation.createSchedule), tripScheduleController.createSchedule);

/**
 * @swagger
 * /schedules/{id}:
 *   put:
 *     summary: Update a trip schedule
 *     description: Update a trip schedule by ID.
 *     tags: [Trip Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TripScheduleUpdate'
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripSchedule'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', 
  authorize(['scheduler','admin', 'super-admin']),
  validateParams(tripScheduleValidation.updateSchedule),
  validateRequest(tripScheduleValidation.updateSchedule),
  tripScheduleController.updateSchedule
);
/**
 * @swagger
 * /schedules/{id}:
 *   delete:
 *     summary: Delete a trip schedule
 *     description: Delete a trip schedule by ID.
 *     tags: [Trip Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip schedule ID
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id/cancel', authorize(['scheduler','admin', 'super-admin']), validateParams(tripScheduleValidation.cancelSchedule), tripScheduleController.cancelSchedule);

/**
 * @swagger
 * /schedules/{id}:
 *   delete:
 *     summary: Delete a trip schedule
 *     description: Delete a trip schedule by ID.
 *     tags: [Trip Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip schedule ID
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authorize(['scheduler','admin', 'super-admin']), validateParams(tripScheduleValidation.deleteSchedule), tripScheduleController.deleteSchedule);

/**
 * @swagger
 * /schedules/check-availability:
 *   post:
 *     summary: Check availability for scheduling
 *     description: Check if driver and vehicle are available for scheduling
 *     tags: [Trip Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AvailabilityCheck'
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAvailable:
 *                   type: boolean
 *                 conflictingSchedules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TripSchedule'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/check-availability',
  authorize(['scheduler','admin', 'super-admin']),
  validateRequest(tripScheduleValidation.checkAvailability),
  tripScheduleController.checkAvailability
);

// Add the following routes for driver trips

// Get all trips for the authenticated driver
router
  .route('/driver/me')
  .get(authorize(['driver']), tripScheduleController.getDriverMyTrips);

// Get upcoming trips for the authenticated driver
router
  .route('/driver/me/upcoming')
  .get(authorize(['driver']), tripScheduleController.getDriverMyUpcomingTrips);

// Start a trip
router
  .route('/:tripId/start')
  .patch(authorize(['driver']), tripScheduleController.startTrip);

// Complete a trip
router
  .route('/:tripId/complete')
  .patch(authorize(['driver']), tripScheduleController.completeTrip);

module.exports = router; 