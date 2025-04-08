const express = require('express');
const { validateRequest, validateParams } = require('../middleware/validate.middleware');
const { verifyToken, authorize } = require('../middleware/auth.middleware');
const maintenanceController = require('../controllers/maintenance.controller');
const {
  createMaintenance,
  updateMaintenance,
  updateStatus,
  addDocument,
  getById,
  getByVehicle,
  deleteMaintenance
} = require('../validators/maintenance.validator');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /maintenance:
 *   get:
 *     summary: Get all maintenance records
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: JSON stringified filter object
 *       - in: query
 *         name: options
 *         schema:
 *           type: string
 *         description: JSON stringified options object with pagination
 *     responses:
 *       200:
 *         description: List of maintenance records
 *       401:
 *         description: Unauthorized
 */
router.get('/', authorize(['admin', 'super-admin', 'manager']), maintenanceController.getAllMaintenance);

/**
 * @swagger
 * /maintenance/query:
 *   get:
 *     summary: Query maintenance records
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Text search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [preventive, corrective, predictive, scheduled, emergency]
 *         description: Filter by maintenance type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority
 *       - in: query
 *         name: vehicle
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *       - in: query
 *         name: options
 *         schema:
 *           type: string
 *         description: JSON stringified options object with pagination
 *     responses:
 *       200:
 *         description: List of filtered maintenance records
 *       401:
 *         description: Unauthorized
 */
router.get('/query', authorize(['admin', 'super-admin', 'manager']), maintenanceController.queryMaintenance);

/**
 * @swagger
 * /maintenance/{maintenanceId}:
 *   get:
 *     summary: Get maintenance record by ID
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: maintenanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance ID
 *     responses:
 *       200:
 *         description: Maintenance record details
 *       404:
 *         description: Maintenance record not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:maintenanceId', authorize(['admin', 'super-admin', 'manager']), validateParams(getById), maintenanceController.getMaintenance);

/**
 * @swagger
 * /maintenance/vehicle/{vehicleId}:
 *   get:
 *     summary: Get maintenance records by vehicle ID
 *     tags: [Maintenance]
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
 *         name: filter
 *         schema:
 *           type: string
 *         description: JSON stringified filter object
 *       - in: query
 *         name: options
 *         schema:
 *           type: string
 *         description: JSON stringified options object with pagination
 *     responses:
 *       200:
 *         description: List of maintenance records for the vehicle
 *       401:
 *         description: Unauthorized
 */
router.get('/vehicle/:vehicleId', authorize(['admin', 'super-admin', 'manager']), validateParams(getByVehicle), maintenanceController.getMaintenanceByVehicle);

/**
 * @swagger
 * /maintenance:
 *   post:
 *     summary: Create new maintenance record
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMaintenance'
 *     responses:
 *       201:
 *         description: Maintenance record created successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post('/', authorize(['admin', 'super-admin', 'manager']), validateRequest(createMaintenance), maintenanceController.createMaintenance);

/**
 * @swagger
 * /maintenance/{maintenanceId}:
 *   put:
 *     summary: Update maintenance record
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: maintenanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMaintenance'
 *     responses:
 *       200:
 *         description: Maintenance record updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Maintenance record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.put('/:maintenanceId', authorize(['admin', 'super-admin', 'manager']), validateParams(getById), validateRequest(updateMaintenance), maintenanceController.updateMaintenance);

/**
 * @swagger
 * /maintenance/{maintenanceId}/status:
 *   patch:
 *     summary: Update maintenance status
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: maintenanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance ID
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
 *                 enum: [pending, in-progress, completed, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maintenance status updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Maintenance record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.patch('/:maintenanceId/status', authorize(['admin', 'super-admin', 'manager']), validateParams(getById), validateRequest(updateStatus), maintenanceController.updateMaintenanceStatus);

/**
 * @swagger
 * /maintenance/{maintenanceId}/documents:
 *   post:
 *     summary: Add document to maintenance record
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: maintenanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *             properties:
 *               document:
 *                 type: object
 *                 required:
 *                   - name
 *                   - type
 *                   - url
 *                 properties:
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                   url:
 *                     type: string
 *                   size:
 *                     type: number
 *     responses:
 *       200:
 *         description: Document added successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Maintenance record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post('/:maintenanceId/documents', authorize(['admin', 'super-admin', 'manager']), validateParams(getById), validateRequest(addDocument), maintenanceController.addMaintenanceDocument);

/**
 * @swagger
 * /maintenance/{maintenanceId}:
 *   delete:
 *     summary: Delete maintenance record
 *     tags: [Maintenance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: maintenanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance ID
 *     responses:
 *       204:
 *         description: Maintenance record deleted successfully
 *       404:
 *         description: Maintenance record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.delete('/:maintenanceId', authorize(['admin', 'super-admin']), validateParams(deleteMaintenance), maintenanceController.deleteMaintenance);

module.exports = router; 