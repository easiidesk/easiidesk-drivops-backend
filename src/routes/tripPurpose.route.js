const express = require('express');
const { validateRequest, validateParams, validateQuery } = require('../middleware/validate.middleware');
const tripPurposeController = require('../controllers/tripPurpose.controller');
const tripPurposeValidation = require('../validators/tripPurpose.validator');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Trip Purposes
 *   description: Trip purpose management
 */

/**
 * @swagger
 * /trip-purposes:
 *   get:
 *     summary: Get all trip purposes
 *     description: Retrieve all active trip purposes.
 *     tags: [Trip Purposes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *                     $ref: '#/components/schemas/TripPurpose'
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
router.get('/', validateQuery(tripPurposeValidation.getTripPurposes), tripPurposeController.getTripPurposes);

/**
 * @swagger
 * /trip-purposes/{id}:
 *   get:
 *     summary: Get a trip purpose
 *     description: Get trip purpose by ID
 *     tags: [Trip Purposes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip purpose ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripPurpose'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', validateParams(tripPurposeValidation.getTripPurpose), tripPurposeController.getTripPurpose);

/**
 * @swagger
 * /trip-purposes:
 *   post:
 *     summary: Create a trip purpose
 *     description: Create a new trip purpose.
 *     tags: [Trip Purposes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TripPurposeCreate'
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripPurpose'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', validateRequest(tripPurposeValidation.createTripPurpose), tripPurposeController.createTripPurpose);

/**
 * @swagger
 * /trip-purposes/{id}:
 *   put:
 *     summary: Update a trip purpose
 *     description: Update a trip purpose by ID.
 *     tags: [Trip Purposes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip purpose ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TripPurposeUpdate'
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripPurpose'
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
  validateParams(tripPurposeValidation.updateTripPurpose),
  validateRequest(tripPurposeValidation.updateTripPurpose),
  tripPurposeController.updateTripPurpose
);

/**
 * @swagger
 * /trip-purposes/{id}:
 *   delete:
 *     summary: Delete a trip purpose
 *     description: Delete a trip purpose by ID.
 *     tags: [Trip Purposes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip purpose ID
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', validateParams(tripPurposeValidation.deleteTripPurpose), tripPurposeController.deleteTripPurpose);

module.exports = router; 