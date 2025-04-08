const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../config/env');

/**
 * Login user service
 * @param {string} phone - User phone number
 * @param {string} password - User password
 * @param {string} fcmToken - Firebase Cloud Messaging token
 * @returns {Object} User data and token
 * @throws {Error} If login fails
 */
const login = async (phone, password, fcmToken) => {
  // Find user by phone
  const user = await User.findOne({ phone, deletedAt: null });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check if user is active
  if (!user.isActive || user.deletedAt) {
    throw new Error('User account is inactive');
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }
  
  // Update FCM token if provided
  if (fcmToken && !user.fcmTokens.includes(fcmToken)) {
    user.fcmTokens.push(fcmToken);
    user.updatedAt = new Date();
    await user.save();
  }
  
  // Update last login time
  user.lastLogin = new Date();
  user.updatedAt = new Date();
  await user.save();
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id.toString() },
    config.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Return user data and token
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    fcmTokens: user.fcmTokens,
    token
  };
};

/**
 * Logout user service
 * @param {string} userId - User ID
 * @param {string} fcmToken - Firebase Cloud Messaging token
 * @returns {boolean} True if logout successful
 */
const logout = async (userId, fcmToken) => {
  // If FCM token is provided, clear it
  if (fcmToken) {
    await User.findOneAndUpdate(
      { _id: userId, fcmToken },
      { fcmToken: null, updatedAt: new Date() }
    );
  }
  
  return true;
};

module.exports = {
  login,
  logout
}; 