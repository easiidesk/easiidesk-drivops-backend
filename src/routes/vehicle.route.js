const express = require('express');
const { validateRequest, validateParams } = require('../middleware/validate.middleware');
const { verifyToken, authorize } = require('../middleware/auth.middleware');
const vehicleController = require('../controllers/vehicle.controller');
const {
  createVehicleSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  assignDriverSchema,
  vehicleIdParamSchema
} = require('../validators/vehicle.validator');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Get all vehicles
 *     tags: [Vehicles]
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
 *           enum: [active, maintenance, retired]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sedan, suv, truck, van, bus]
 *         description: Filter by type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by make, model, license plate, or VIN
 *     responses:
 *       200:
 *         description: List of vehicles
 *       401:
 *         description: Unauthorized
 */
router.get('/', vehicleController.getVehicles);

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle details
 *       404:
 *         description: Vehicle not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', validateParams(vehicleIdParamSchema), vehicleController.getVehicle);

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Create new vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVehicle'
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Invalid data
 *       409:
 *         description: Duplicate license plate or VIN
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post('/', authorize(['admin', 'super-admin']), validateRequest(createVehicleSchema), vehicleController.createVehicle);

/**
 * @swagger
 * /vehicles/{id}:
 *   put:
 *     summary: Update vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateVehicle'
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Vehicle not found
 *       409:
 *         description: Duplicate license plate or VIN
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.put('/:id', authorize(['admin', 'super-admin']), validateParams(vehicleIdParamSchema), validateRequest(updateVehicleSchema), vehicleController.updateVehicle);

/**
 * @swagger
 * /vehicles/{id}/status:
 *   put:
 *     summary: Update vehicle status
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
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
 *                 enum: [active, maintenance, retired]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vehicle status updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Vehicle not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.put('/:id/status', authorize(['admin', 'super-admin']), validateParams(vehicleIdParamSchema), validateRequest(updateVehicleStatusSchema), vehicleController.updateVehicleStatus);

/**
 * @swagger
 * /vehicles/{id}/assign-driver:
 *   put:
 *     summary: Assign driver to vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverId
 *             properties:
 *               driverId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver assigned successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Vehicle not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.put('/:id/assign-driver', authorize(['admin', 'super-admin']), validateParams(vehicleIdParamSchema), validateRequest(assignDriverSchema), vehicleController.assignDriver);

/**
 * @swagger
 * /vehicles/{id}/remove-driver:
 *   put:
 *     summary: Remove driver from vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Driver removed successfully
 *       404:
 *         description: Vehicle not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.put('/:id/remove-driver', authorize(['admin', 'super-admin']), validateParams(vehicleIdParamSchema), vehicleController.removeDriver);

/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     summary: Delete vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *       404:
 *         description: Vehicle not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.delete('/:id', authorize(['admin', 'super-admin']), validateParams(vehicleIdParamSchema), vehicleController.deleteVehicle);

module.exports = router; 