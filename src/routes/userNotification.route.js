const express = require('express');
const { validateRequest } = require('../middleware/validate.middleware');
const { verifyToken } = require('../middleware/auth.middleware');
const notificationSettingsController = require('../controllers/notificationSettings.controller');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /notification-settings:
 *   get:
 *     summary: Get user's notification settings
 *     tags: [Notification Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User notification settings
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Settings not found
 */
router.get('/', notificationSettingsController.getSettings);

/**
 * @swagger
 * /notification-settings:
 *   put:
 *     summary: Update user's notification settings
 *     tags: [Notification Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: object
 *                 description: Settings object with role-specific fields
 *                 example:
 *                   receiveNotification: true
 *                   receiveDriverPunchIn: true
 *                   receiveDriverPunchOut: true
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid settings for user role
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/', notificationSettingsController.updateSettings);

module.exports = router; 