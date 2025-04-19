const express = require('express');
const { validateRequest, validateParams } = require('../middleware/validate.middleware');
const { verifyToken, authorize } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');
const {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
  userIdParamSchema,
  updateFcmTokenSchema
} = require('../validators/user.validator');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: User not found
 */
router.get('/me', userController.getMe);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       409:
 *         description: Email or phone already in use
 */
router.put('/me', validateRequest(updateUserSchema), userController.updateProfile);

/**
 * @swagger
 * /users/me/change-password:
 *   put:
 *     summary: Change current user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password is incorrect
 */
router.put('/me/change-password', validateRequest(changePasswordSchema), userController.changePassword);

/**
 * @swagger
 * /users/me/fcm-token:
 *   post:
 *     summary: Update user's FCM token for push notifications
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 description: The Firebase Cloud Messaging token for the user's device
 *               invalidTokens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of invalid tokens to remove
 *     responses:
 *       200:
 *         description: FCM token updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/me/fcm-token', validateRequest(updateFcmTokenSchema), userController.updateFcmToken);

// Admin routes - require admin privileges
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
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
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email or phone
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Access denied
 */
router.get('/', authorize(['admin', 'super-admin']), userController.getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied
 */
router.get('/:id', authorize(['admin', 'super-admin']), validateParams(userIdParamSchema), userController.getUser);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [requestor, scheduler, cost-analyst, admin, super-admin, driver]
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: User with same email or phone already exists
 *       403:
 *         description: Access denied
 */
router.post('/', authorize(['admin', 'super-admin']), validateRequest(createUserSchema), userController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [requestor, scheduler, cost-analyst, admin, super-admin, driver]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       409:
 *         description: Email or phone already in use
 *       403:
 *         description: Access denied
 */
router.put('/:id', authorize(['admin', 'super-admin']), validateParams(userIdParamSchema), validateRequest(updateUserSchema), userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', authorize(['admin', 'super-admin']), validateParams(userIdParamSchema), userController.deleteUser);

/**
 * @swagger
 * /users/{id}/reset-password:
 *   post:
 *     summary: Reset user password (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied
 */
router.post('/:id/reset-password', authorize(['admin', 'super-admin']), validateParams(userIdParamSchema), validateRequest(resetPasswordSchema), userController.resetPassword);

module.exports = router; 