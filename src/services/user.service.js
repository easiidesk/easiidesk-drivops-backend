const User = require('../models/user.model');

/**
 * Get all users service
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of users with pagination
 */
const getUsers = async (filters = {}, options = {}) => {
  const defaultOptions = {
    page: 1,
    limit: 10,
    sort: { createdAt: -1 }
  };
  
  const queryOptions = { ...defaultOptions, ...options };
  const skip = (queryOptions.page - 1) * queryOptions.limit;
  
  // Add default filter for active and non-deleted users
  const queryFilters = {
    ...filters,
    deletedAt: null
  };
  
  const users = await User.find(queryFilters)
    .sort(queryOptions.sort)
    .skip(skip)
    .limit(queryOptions.limit);
  
  const total = await User.countDocuments(queryFilters);
  
  return {
    users,
    pagination: {
      total,
      page: queryOptions.page,
      limit: queryOptions.limit,
      pages: Math.ceil(total / queryOptions.limit)
    }
  };
};

/**
 * Get user by ID service
 * @param {string} id - User ID
 * @returns {Promise<Object>} User data
 */
const getUserById = async (id) => {
  return await User.findOne({ _id: id, deletedAt: null });
};

/**
 * Create user service
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} Created user
 */
const createUser = async (userData) => {
  // Check if user with the same email or phone exists
  const existingUser = await User.findOne({
    $or: [
      { email: userData.email },
      { phone: userData.phone }
    ],
    deletedAt: null
  });
  
  if (existingUser) {
    throw new Error('User with the same email or phone number already exists');
  }
  
  // Create new user
  const user = new User(userData);
  await user.save();
  
  return user;
};

/**
 * Update user service
 * @param {string} id - User ID
 * @param {Object} updateData - User data to update
 * @returns {Promise<Object>} Updated user
 */
const updateUser = async (id, updateData) => {
  // Check if user exists
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check for duplicate email or phone if updating those fields
  if (updateData.email || updateData.phone) {
    const query = { 
      _id: { $ne: id },
      deletedAt: null,
      $or: []
    };
    
    if (updateData.email) {
      query.$or.push({ email: updateData.email });
    }
    
    if (updateData.phone) {
      query.$or.push({ phone: updateData.phone });
    }
    
    if (query.$or.length > 0) {
      const existingUser = await User.findOne(query);
      if (existingUser) {
        throw new Error('Email or phone number already in use');
      }
    }
  }
  
  // Update user
  Object.keys(updateData).forEach(key => {
    user[key] = updateData[key];
  });
  
  user.updatedAt = new Date();
  await user.save();
  
  return user;
};

/**
 * Delete user service
 * @param {string} id - User ID
 * @returns {Promise<Object>} Deleted user
 */
const deleteUser = async (id) => {
  // Check if user exists
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) {
    throw new Error('User not found');
  }
  
  // Soft delete
  user.isActive = false;
  user.deletedAt = new Date();
  user.updatedAt = new Date();
  await user.save();
  
  return user;
};

/**
 * Change password service
 * @param {string} id - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Updated user
 */
const changePassword = async (id, currentPassword, newPassword) => {
  // Check if user exists
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) {
    throw new Error('User not found');
  }
  
  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }
  
  // Update password
  user.password = newPassword;
  user.updatedAt = new Date();
  await user.save();
  
  return user;
};

/**
 * Reset password service (admin only)
 * @param {string} id - User ID
 * @param {string} password - New password
 * @returns {Promise<Object>} Updated user
 */
const resetPassword = async (id, password) => {
  // Check if user exists
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) {
    throw new Error('User not found');
  }
  
  // Update password
  user.password = password;
  user.updatedAt = new Date();
  await user.save();
  
  return user;
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  resetPassword
}; 