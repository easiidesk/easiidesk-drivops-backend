const express = require('express');
const { validateRequest, validateParams } = require('../middleware/validate.middleware');
const { verifyToken, authorize } = require('../middleware/auth.middleware');
const driverController = require('../controllers/driver.controller');
const {
  driverIdParamSchema,
  documentIdParamSchema,
  createDriverSchema,
  updateDriverSchema,
  updateDriverStatusSchema,
  addDocumentSchema
} = require('../validators/driver.validator');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /drivers:
 *   get:
 *     summary: Get all drivers
 *     tags: [Drivers]
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
 *           enum: [active, inactive, on_leave, suspended]
 *         description: Filter by status
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: Filter by availability
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, phone, or license number
 *     responses:
 *       200:
 *         description: List of drivers
 *       401:
 *         description: Unauthorized
 */
router.get('/', authorize(['requestor','scheduler','cost-analyst','admin', 'super-admin']), driverController.getDrivers);

/**
 * @swagger
 * /driver/schedules:
 *   get:
 *     summary: Get driver's schedules
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, started, completed, cancelled]
 *         description: Filter by schedule status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of driver's schedules
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No schedules found
 */
router.get('/schedules', authorize(['driver']), driverController.getDriverSchedules);


/**
 * @swagger
 * /drivers/{id}:
 *   get:
 *     summary: Get driver by ID
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *     responses:
 *       200:
 *         description: Driver details
 *       404:
 *         description: Driver not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authorize(['admin', 'super-admin']), validateParams(driverIdParamSchema), driverController.getDriver);

/**
 * @swagger
 * /drivers/profile/me:
 *   get:
 *     summary: Get my driver profile
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver profile
 *       404:
 *         description: Driver profile not found
 *       401:
 *         description: Unauthorized
 */
router.get('/profile/me', authorize(['driver']), driverController.getMyProfile);

/**
 * @swagger
 * /drivers:
 *   post:
 *     summary: Create new driver
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDriver'
 *     responses:
 *       201:
 *         description: Driver created successfully
 *       400:
 *         description: Invalid data
 *       409:
 *         description: Driver profile already exists for this user or license already registered
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post('/', authorize(['admin', 'super-admin']), validateRequest(createDriverSchema), driverController.createDriver);

/**
 * @swagger
 * /drivers/{id}:
 *   put:
 *     summary: Update driver
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDriver'
 *     responses:
 *       200:
 *         description: Driver updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Driver not found
 *       409:
 *         description: License number already registered with another driver
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.put('/:id', authorize(['admin', 'super-admin']), validateParams(driverIdParamSchema), validateRequest(updateDriverSchema), driverController.updateDriver);

/**
 * @swagger
 * /drivers/{id}/status:
 *   put:
 *     summary: Update driver status
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
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
 *                 enum: [active, inactive, on_leave, suspended]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver status updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Driver not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.put('/:id/status', authorize(['admin', 'super-admin']), validateParams(driverIdParamSchema), validateRequest(updateDriverStatusSchema), driverController.updateDriverStatus);

/**
 * @swagger
 * /drivers/{id}/documents:
 *   post:
 *     summary: Add document to driver
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - url
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [license, id_card, insurance, medical, background_check]
 *               url:
 *                 type: string
 *               verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Document added successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Driver not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post('/:id/documents', authorize(['admin', 'super-admin', 'driver']), validateParams(driverIdParamSchema), validateRequest(addDocumentSchema), driverController.addDocument);

/**
 * @swagger
 * /drivers/{driverId}/documents/{documentId}/verify:
 *   put:
 *     summary: Verify driver document
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document verified successfully
 *       404:
 *         description: Driver or document not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.put('/:driverId/documents/:documentId/verify', authorize(['admin', 'super-admin']), validateParams(documentIdParamSchema), driverController.verifyDocument);

/**
 * @swagger
 * /drivers/{id}:
 *   delete:
 *     summary: Delete driver
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *     responses:
 *       200:
 *         description: Driver deleted successfully
 *       404:
 *         description: Driver not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.delete('/:id', authorize(['admin', 'super-admin']), validateParams(driverIdParamSchema), driverController.deleteDriver);


module.exports = router; 