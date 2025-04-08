const express = require('express');
const { validateRequest, validateParams } = require('../middleware/validate.middleware');
const { verifyToken, authorize } = require('../middleware/auth.middleware');
const tripController = require('../controllers/trip.controller');
const {
  tripIdParamSchema,
  checkpointIdParamSchema,
  driverIdParamSchema,
  vehicleIdParamSchema,
  createTripSchema,
  updateTripSchema,
  updateTripStatusSchema,
  addCheckpointSchema,
  updateCheckpointStatusSchema
} = require('../validators/trip.validator');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /trips:
 *   get:
 *     summary: Get all trips
 *     tags: [Trips]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (start from)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date (end at)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or purpose
 *     responses:
 *       200:
 *         description: List of trips
 *       401:
 *         description: Unauthorized
 */
router.get('/', authorize(['admin', 'super-admin']), tripController.getTrips);

/**
 * @swagger
 * /trips/{id}:
 *   get:
 *     summary: Get trip by ID
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip details
 *       404:
 *         description: Trip not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authorize(['admin', 'super-admin', 'driver']), validateParams(tripIdParamSchema), tripController.getTrip);

/**
 * @swagger
 * /trips/driver/{driverId}:
 *   get:
 *     summary: Get trips for a specific driver
 *     tags: [Trips]
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
 *         description: List of trips for the driver
 *       401:
 *         description: Unauthorized
 */
router.get('/driver/:driverId', authorize(['admin', 'super-admin']), validateParams(driverIdParamSchema), tripController.getTripsByDriver);

/**
 * @swagger
 * /trips/vehicle/{vehicleId}:
 *   get:
 *     summary: Get trips for a specific vehicle
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
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
 *         description: List of trips for the vehicle
 *       401:
 *         description: Unauthorized
 */
router.get('/vehicle/:vehicleId', authorize(['admin', 'super-admin']), validateParams(vehicleIdParamSchema), tripController.getTripsByVehicle);

/**
 * @swagger
 * /trips/my-trips:
 *   get:
 *     summary: Get trips assigned to the authenticated driver
 *     tags: [Trips]
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
 *     responses:
 *       200:
 *         description: List of trips for the driver
 *       401:
 *         description: Unauthorized
 */
router.get('/my-trips', authorize(['driver']), tripController.getMyTrips);

/**
 * @swagger
 * /trips:
 *   post:
 *     summary: Create new trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTrip'
 *     responses:
 *       201:
 *         description: Trip created successfully
 *       400:
 *         description: Invalid data
 *       409:
 *         description: Scheduling conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post('/', authorize(['admin', 'super-admin']), validateRequest(createTripSchema), tripController.createTrip);

/**
 * @swagger
 * /trips/{id}:
 *   put:
 *     summary: Update trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTrip'
 *     responses:
 *       200:
 *         description: Trip updated successfully
 *       400:
 *         description: Invalid data or cannot update completed/cancelled trip
 *       404:
 *         description: Trip not found
 *       409:
 *         description: Scheduling conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.put('/:id', authorize(['admin', 'super-admin']), validateParams(tripIdParamSchema), validateRequest(updateTripSchema), tripController.updateTrip);

/**
 * @swagger
 * /trips/{id}/status:
 *   put:
 *     summary: Update trip status
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, in_progress, completed, cancelled]
 *               distance:
 *                 type: number
 *               duration:
 *                 type: number
 *               fuelConsumption:
 *                 type: number
 *               maintenanceRequired:
 *                 type: boolean
 *               maintenanceNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trip status updated successfully
 *       400:
 *         description: Invalid data or invalid status transition
 *       404:
 *         description: Trip not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.put('/:id/status', authorize(['admin', 'super-admin', 'driver']), validateParams(tripIdParamSchema), validateRequest(updateTripStatusSchema), tripController.updateTripStatus);

/**
 * @swagger
 * /trips/{id}/checkpoints:
 *   post:
 *     summary: Add checkpoint to trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *             properties:
 *               location:
 *                 type: object
 *                 required:
 *                   - coordinates
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                   address:
 *                     type: string
 *               status:
 *                 type: string
 *                 enum: [reached, skipped, pending]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkpoint added successfully
 *       400:
 *         description: Invalid data or cannot add checkpoint to completed/cancelled trip
 *       404:
 *         description: Trip not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post('/:id/checkpoints', authorize(['admin', 'super-admin', 'driver']), validateParams(tripIdParamSchema), validateRequest(addCheckpointSchema), tripController.addCheckpoint);

/**
 * @swagger
 * /trips/{tripId}/checkpoints/{checkpointId}/status:
 *   put:
 *     summary: Update checkpoint status
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *       - in: path
 *         name: checkpointId
 *         required: true
 *         schema:
 *           type: string
 *         description: Checkpoint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reached, skipped, pending]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkpoint status updated successfully
 *       400:
 *         description: Invalid data or cannot update checkpoint in a trip that is not in progress
 *       404:
 *         description: Trip or checkpoint not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.put('/:tripId/checkpoints/:checkpointId/status', authorize(['admin', 'super-admin', 'driver']), validateParams(checkpointIdParamSchema), validateRequest(updateCheckpointStatusSchema), tripController.updateCheckpointStatus);

/**
 * @swagger
 * /trips/{id}:
 *   delete:
 *     summary: Delete trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip deleted successfully
 *       400:
 *         description: Cannot delete a trip that is in progress
 *       404:
 *         description: Trip not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.delete('/:id', authorize(['admin', 'super-admin']), validateParams(tripIdParamSchema), tripController.deleteTrip);

module.exports = router; 