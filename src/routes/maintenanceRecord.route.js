/**
 * Maintenance Record Routes
 * Defines routes for vehicle maintenance record operations
 */
const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth.middleware');
const { validateRequest, validateParams } = require('../middleware/validate.middleware');
const maintenanceRecordController = require('../controllers/maintenanceRecord.controller');
const {
  createMaintenanceRecordSchema,
  updateMaintenanceRecordSchema,
  approvalSchema,
  completionSchema,
  idParamSchema,
  vehicleIdParamSchema,
  queryParamsSchema
} = require('../validators/maintenanceRecord.validator');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /maintenance-records:
 *   post:
 *     summary: Create a new maintenance record
 *     tags: [Maintenance Records]
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
 *               - maintenanceType
 *               - description
 *               - amount
 *               - odometer
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               maintenanceType:
 *                 type: string
 *                 enum: [preventive, corrective, scheduled, emergency, other]
 *                 example: "scheduled"
 *               description:
 *                 type: string
 *                 example: "Oil change and filter replacement"
 *               amount:
 *                 type: number
 *                 example: 120.50
 *               odometer:
 *                 type: number
 *                 example: 15780
 *               serviceLocation:
 *                 type: string
 *                 example: "Central Auto Service"
 *               servicedBy:
 *                 type: string
 *                 example: "John Mechanic"
 *               parts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Oil Filter"
 *                     quantity:
 *                       type: number
 *                       example: 1
 *                     cost:
 *                       type: number
 *                       example: 15.99
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Service Request Form"
 *                     url:
 *                       type: string
 *                       example: "https://example.com/document.pdf"
 *               notes:
 *                 type: string
 *                 example: "Vehicle making unusual noise during acceleration"
 *     responses:
 *       201:
 *         description: Maintenance record created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only drivers can create maintenance records
 *       404:
 *         description: Vehicle not found
 */
router.post('/', 
  authorize(['driver']),
  validateRequest(createMaintenanceRecordSchema),
  maintenanceRecordController.createMaintenanceRecord
);

/**
 * @swagger
 * /maintenance-records:
 *   get:
 *     summary: Get all maintenance records
 *     tags: [Maintenance Records]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, completed, rejected]
 *         description: Filter by status
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
 *         description: List of maintenance records
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get('/', 
  authorize(['admin', 'super-admin']),
  validateRequest(queryParamsSchema),
  maintenanceRecordController.getAllMaintenanceRecords
);

/**
 * @swagger
 * /maintenance-records/my-records:
 *   get:
 *     summary: Get current user's maintenance records
 *     tags: [Maintenance Records]
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
 *           enum: [pending, approved, completed, rejected]
 *         description: Filter by status
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
 *         description: List of user's maintenance records
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only drivers can access this endpoint
 */
router.get('/my-records', 
  authorize(['driver']),
  validateRequest(queryParamsSchema),
  maintenanceRecordController.getMyMaintenanceRecords
);

/**
 * @swagger
 * /maintenance-records/vehicle/{vehicleId}:
 *   get:
 *     summary: Get maintenance records for a specific vehicle
 *     tags: [Maintenance Records]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, completed, rejected]
 *         description: Filter by status
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
 *         description: List of vehicle's maintenance records
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
  maintenanceRecordController.getVehicleMaintenanceRecords
);

/**
 * @swagger
 * /maintenance-records/{id}:
 *   get:
 *     summary: Get a maintenance record by ID
 *     tags: [Maintenance Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance record ID
 *     responses:
 *       200:
 *         description: Maintenance record details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Maintenance record not found
 */
router.get('/:id', 
  validateParams(idParamSchema),
  maintenanceRecordController.getMaintenanceRecordById
);

/**
 * @swagger
 * /maintenance-records/{id}:
 *   put:
 *     summary: Update a maintenance record
 *     tags: [Maintenance Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 example: "Updated maintenance description"
 *               amount:
 *                 type: number
 *                 example: 150.75
 *               odometer:
 *                 type: number
 *                 example: 15800
 *               serviceLocation:
 *                 type: string
 *                 example: "Updated service location"
 *               servicedBy:
 *                 type: string
 *                 example: "Updated service provider"
 *               parts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     cost:
 *                       type: number
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     url:
 *                       type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maintenance record updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Maintenance record not found
 */
router.put('/:id', 
  validateParams(idParamSchema),
  validateRequest(updateMaintenanceRecordSchema),
  maintenanceRecordController.updateMaintenanceRecord
);

/**
 * @swagger
 * /maintenance-records/{id}/approval:
 *   patch:
 *     summary: Approve or reject a maintenance record
 *     tags: [Maintenance Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance record ID
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
 *                 enum: [approved, rejected]
 *                 example: "approved"
 *               notes:
 *                 type: string
 *                 example: "Approved for scheduled maintenance"
 *     responses:
 *       200:
 *         description: Maintenance record approval status updated
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Maintenance record not found
 */
router.patch('/:id/approval', 
  authorize(['admin', 'super-admin']),
  validateParams(idParamSchema),
  validateRequest(approvalSchema),
  maintenanceRecordController.approveOrRejectMaintenanceRecord
);

/**
 * @swagger
 * /maintenance-records/{id}/complete:
 *   patch:
 *     summary: Mark a maintenance record as completed
 *     tags: [Maintenance Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance record ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Maintenance completed successfully"
 *     responses:
 *       200:
 *         description: Maintenance record marked as completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Maintenance record not found
 */
router.patch('/:id/complete', 
  authorize(['admin', 'super-admin']),
  validateParams(idParamSchema),
  validateRequest(completionSchema),
  maintenanceRecordController.completeMaintenanceRecord
);

/**
 * @swagger
 * /maintenance-records/{id}:
 *   delete:
 *     summary: Delete a maintenance record
 *     tags: [Maintenance Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance record ID
 *     responses:
 *       200:
 *         description: Maintenance record deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Maintenance record not found
 */
router.delete('/:id', 
  validateParams(idParamSchema),
  maintenanceRecordController.deleteMaintenanceRecord
);

module.exports = router; 