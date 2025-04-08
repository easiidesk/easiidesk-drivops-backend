const userService = require('../services/user.service');
const { successResponse, errorResponse } = require('../common/responses/response.utils');

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getUsers = async (req, res, next) => {
  try {
    // Extract query parameters
    const { page = 1, limit = 10, role, search } = req.query;
    
    // Build filters
    const filters = {};
    if (role) {
      filters.role = role;
    }
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build options
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 }
    };
    
    // Get users
    const result = await userService.getUsers(filters, options);
    
    return res.status(200).json(successResponse(result));
  } catch (err) {
    next(err);
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get user
    const user = await userService.getUserById(id);
    
    if (!user) {
      return res.status(404).json(errorResponse('User not found', 404));
    }
    
    return res.status(200).json(successResponse(user));
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getMe = async (req, res, next) => {
  try {
    // User object is already available in req.user from auth middleware
    return res.status(200).json(successResponse(req.user));
  } catch (err) {
    next(err);
  }
};

/**
 * Create user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createUser = async (req, res, next) => {
  try {
    // Create user
    const user = await userService.createUser(req.body);
    
    return res.status(201).json(successResponse(user, 'User created successfully'));
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(409).json(errorResponse(err.message, 409));
    }
    
    next(err);
  }
};

/**
 * Update user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Update user
    const user = await userService.updateUser(id, req.body);
    
    if (!user) {
      return res.status(404).json(errorResponse('User not found', 404));
    }
    
    return res.status(200).json(successResponse(user, 'User updated successfully'));
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    if (err.message.includes('already in use')) {
      return res.status(409).json(errorResponse(err.message, 409));
    }
    
    next(err);
  }
};

/**
 * Update current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Only allow updating certain fields
    const allowedFields = ['name', 'email', 'phone'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    // Update user
    const user = await userService.updateUser(userId, updateData);
    
    return res.status(200).json(successResponse(user, 'Profile updated successfully'));
  } catch (err) {
    if (err.message.includes('already in use')) {
      return res.status(409).json(errorResponse(err.message, 409));
    }
    
    next(err);
  }
};

/**
 * Change password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    
    // Change password
    await userService.changePassword(userId, currentPassword, newPassword);
    
    return res.status(200).json(successResponse(null, 'Password changed successfully'));
  } catch (err) {
    if (err.message === 'Current password is incorrect') {
      return res.status(400).json(errorResponse(err.message, 400));
    }
    
    next(err);
  }
};

/**
 * Reset password (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    // Reset password
    await userService.resetPassword(id, password);
    
    return res.status(200).json(successResponse(null, 'Password reset successfully'));
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    next(err);
  }
};

/**
 * Delete user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete user
    await userService.deleteUser(id);
    
    return res.status(200).json(successResponse(null, 'User deleted successfully'));
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json(errorResponse(err.message, 404));
    }
    
    next(err);
  }
};

module.exports = {
  getUsers,
  getUser,
  getMe,
  createUser,
  updateUser,
  updateProfile,
  changePassword,
  resetPassword,
  deleteUser
}; 