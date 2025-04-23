/**
 * Fueling Record Routes
 * Defines routes for vehicle fueling record operations
 */
const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth.middleware');
const { validateRequest, validateParams } = require('../middleware/validate.middleware');
const fuelingRecordController = require('../controllers/fuelingRecord.controller');
const {
  createFuelingRecordSchema,
  updateFuelingRecordSchema,
  idParamSchema,
  vehicleIdParamSchema,
  queryParamsSchema
} = require('../validators/fuelingRecord.validator');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /fueling-records:
 *   post:
 *     summary: Create a new fueling record
 *     tags: [Fueling Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - amount
 *               - cost
 *               - odometer
 *               - fuelType
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               amount:
 *                 type: number
 *                 example: 45.5
 *               cost:
 *                 type: number
 *                 example: 250.75
 *               odometer:
 *                 type: number
 *                 example: 15780
 *               fueledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-07-15T14:30:00Z"
 *               fuelType:
 *                 type: string
 *                 enum: [petrol, diesel, electric, cng, lpg]
 *                 example: "diesel"
 *               location:
 *                 type: string
 *                 example: "Shell Station, Main Street"
 *               notes:
 *                 type: string
 *                 example: "Regular maintenance refill"
 *               receiptImage:
 *                 type: string
 *                 example: "https://example.com/receipt.jpg"
 *     responses:
 *       201:
 *         description: Fueling record created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 */
router.post('/', 
  validateRequest(createFuelingRecordSchema),
  fuelingRecordController.createFuelingRecord
);

/**
 * @swagger
 * /fueling-records:
 *   get:
 *     summary: Get all fueling records
 *     tags: [Fueling Records]
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
 *         name: vehicleId
 *         schema:
 *           type: string
 *         description: Filter by vehicle ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: List of fueling records
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get('/', 
  authorize(['admin', 'super-admin']),
  validateRequest(queryParamsSchema),
  fuelingRecordController.getAllFuelingRecords
);

/**
 * @swagger
 * /fueling-records/my-records:
 *   get:
 *     summary: Get current user's fueling records
 *     tags: [Fueling Records]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: List of user's fueling records
 *       401:
 *         description: Unauthorized
 */
router.get('/my-records', 
  validateRequest(queryParamsSchema),
  fuelingRecordController.getMyFuelingRecords
);

/**
 * @swagger
 * /fueling-records/vehicle/{vehicleId}:
 *   get:
 *     summary: Get fueling records for a specific vehicle
 *     tags: [Fueling Records]
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
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: List of vehicle's fueling records
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Vehicle not found
 */
router.get('/vehicle/:vehicleId', 
  authorize(['admin', 'super-admin']),
  validateParams(vehicleIdParamSchema),
  validateRequest(queryParamsSchema),
  fuelingRecordController.getVehicleFuelingRecords
);

/**
 * @swagger
 * /fueling-records/{id}:
 *   get:
 *     summary: Get a fueling record by ID
 *     tags: [Fueling Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fueling record ID
 *     responses:
 *       200:
 *         description: Fueling record details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Fueling record not found
 */
router.get('/:id', 
  validateParams(idParamSchema),
  fuelingRecordController.getFuelingRecordById
);

/**
 * @swagger
 * /fueling-records/{id}:
 *   put:
 *     summary: Update a fueling record
 *     tags: [Fueling Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fueling record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 45.5
 *               cost:
 *                 type: number
 *                 example: 250.75
 *               odometer:
 *                 type: number
 *                 example: 15780
 *               fueledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-07-15T14:30:00Z"
 *               fuelType:
 *                 type: string
 *                 enum: [petrol, diesel, electric, cng, lpg]
 *                 example: "diesel"
 *               location:
 *                 type: string
 *                 example: "Shell Station, Main Street"
 *               notes:
 *                 type: string
 *                 example: "Regular maintenance refill"
 *               receiptImage:
 *                 type: string
 *                 example: "https://example.com/receipt.jpg"
 *     responses:
 *       200:
 *         description: Fueling record updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Fueling record not found
 */
router.put('/:id', 
  validateParams(idParamSchema),
  validateRequest(updateFuelingRecordSchema),
  fuelingRecordController.updateFuelingRecord
);

/**
 * @swagger
 * /fueling-records/{id}:
 *   delete:
 *     summary: Delete a fueling record
 *     tags: [Fueling Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fueling record ID
 *     responses:
 *       200:
 *         description: Fueling record deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Fueling record not found
 */
router.delete('/:id', 
  authorize(['admin', 'super-admin']),
  validateParams(idParamSchema),
  fuelingRecordController.deleteFuelingRecord
);

module.exports = router; 