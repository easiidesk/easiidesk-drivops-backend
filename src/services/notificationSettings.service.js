const httpStatus = require('http-status');
const { UserNotificationSettings, adminNotificationSchema, requestorNotificationSchema, driverNotificationSchema } = require('../models/userNotificationSettings.model');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Get default settings based on user role
 * @param {string} role
 * @returns {Object} Default settings for the role
 */
const getDefaultSettings = (role) => {
  switch (role) {
    case 'admin':
    case 'super-admin':
    case 'scheduler':
      return adminNotificationSchema;
    case 'requestor':
      return requestorNotificationSchema;
    case 'driver':
      return driverNotificationSchema;
    default:
      return {};
  }
};

/**
 * Get user notification settings
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
const getSettings = async (userId) => {
  let settings = await UserNotificationSettings.findOne({ userId, isActive: true });
  
  if (!settings) {
    // Create default settings if not exists
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    
    const defaultSettings = getDefaultSettings(user.role);
    settings = await UserNotificationSettings.create({
      userId,
      settings: defaultSettings
    });
  }
  
  return settings;
};

/**
 * Update user notification settings
 * @param {ObjectId} userId
 * @param {Object} newSettings
 * @returns {Promise<Object>}
 */
const updateSettings = async (userId, newSettings) => {
  let settings = await UserNotificationSettings.findOne({ userId, isActive: true });
  
  if (!settings) {
    // Create new settings if not exists
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    
    const defaultSettings = getDefaultSettings(user.role);
    settings = await UserNotificationSettings.create({
      userId,
      settings: { ...defaultSettings, ...newSettings }
    });
  } else {
    // Update existing settings
    settings.settings = { ...settings.settings, ...newSettings };
    await settings.save();
  }
  
  return settings;
};

/**
 * Reset notification settings to default for a user role
 * @param {string} role - User role
 * @returns {Promise<Object>}
 */
const resetSettingsForRole = async (role) => {
  const defaultSettings = getDefaultSettings(role);
  
  // Create a template for super admin
  await UserNotificationSettings.findOneAndUpdate(
    { role },
    { settings: defaultSettings },
    { upsert: true, new: true }
  );
  
  return { success: true, role, settings: defaultSettings };
};

module.exports = {
  getSettings,
  updateSettings,
  resetSettingsForRole
}; 