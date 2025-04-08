const express = require('express');
const { validateRequest, validateParams, validateQuery } = require('../middleware/validate.middleware');
const tripRequestController = require('../controllers/tripRequest.controller');
const tripRequestValidation = require('../validators/tripRequest.validator');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Trip Requests
 *   description: Trip request management
 */

/**
 * @swagger
 * /trip-requests:
 *   get:
 *     summary: Get all trip requests
 *     description: Retrieve trip requests with filters and pagination.
 *     tags: [Trip Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, scheduled, cancelled]
 *         description: Trip request status
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
 *                     $ref: '#/components/schemas/TripRequest'
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
router.get('/', validateQuery(tripRequestValidation.getTripRequests), tripRequestController.getTripRequests);

/**
 * @swagger
 * /trip-requests/{id}:
 *   get:
 *     summary: Get a trip request
 *     description: Get trip request by ID
 *     tags: [Trip Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip request ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', validateParams(tripRequestValidation.getTripRequest), tripRequestController.getTripRequest);

/**
 * @swagger
 * /trip-requests:
 *   post:
 *     summary: Create a trip request
 *     description: Create a new trip request.
 *     tags: [Trip Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TripRequestCreate'
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripRequest'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', validateRequest(tripRequestValidation.createTripRequest), tripRequestController.createTripRequest);

/**
 * @swagger
 * /trip-requests/{id}:
 *   put:
 *     summary: Update a trip request
 *     description: Update a trip request by ID.
 *     tags: [Trip Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TripRequestUpdate'
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TripRequest'
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
  validateParams(tripRequestValidation.updateTripRequest),
  validateRequest(tripRequestValidation.updateTripRequest),
  tripRequestController.updateTripRequest
);

/**
 * @swagger
 * /trip-requests/{id}:
 *   delete:
 *     summary: Delete a trip request
 *     description: Delete a trip request by ID.
 *     tags: [Trip Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip request ID
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
router.delete('/:id', validateParams(tripRequestValidation.deleteTripRequest), tripRequestController.deleteTripRequest);

module.exports = router; 