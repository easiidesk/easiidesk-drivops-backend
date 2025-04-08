const httpStatus = require('http-status');
const { UserNotificationSettings, adminNotificationSchema, requestorNotificationSchema, driverNotificationSchema } = require('../models/userNotificationSettings.model');
const ApiError = require('../utils/ApiError');

/**
 * Get notification settings for a user
 * @param {ObjectId} userId
 * @returns {Promise<UserNotificationSettings>}
 */
const getSettings = async (userId) => {
  const settings = await UserNotificationSettings.findOne({ userId, isActive: true });
  
  if (!settings) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification settings not found');
  }
  
  return settings;
};

/**
 * Get or create notification settings for a user
 * @param {ObjectId} userId
 * @param {string} role - User role
 * @returns {Promise<UserNotificationSettings>}
 */
const getOrCreateSettings = async (userId, role) => {
  let settings = await UserNotificationSettings.findOne({ userId, isActive: true });
  
  if (!settings) {
    // Create default settings based on role
    let defaultSettings;
    
    switch (role) {
      case 'admin':
      case 'super-admin':
        defaultSettings = { ...adminNotificationSchema };
        break;
      case 'driver':
        defaultSettings = { ...driverNotificationSchema };
        break;
      default:
        defaultSettings = { ...requestorNotificationSchema };
        break;
    }
    
    settings = await UserNotificationSettings.create({
      userId,
      settings: defaultSettings
    });
  }
  
  return settings;
};

/**
 * Update notification settings for a user
 * @param {ObjectId} userId
 * @param {Object} updateBody - New settings
 * @returns {Promise<UserNotificationSettings>}
 */
const updateSettings = async (userId, updateBody) => {
  const settings = await UserNotificationSettings.findOne({ userId, isActive: true });
  
  if (!settings) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification settings not found');
  }
  
  settings.settings = {
    ...settings.settings,
    ...updateBody
  };
  
  await settings.save();
  return settings;
};

/**
 * Reset notification settings to default for a user role
 * @param {string} role - User role
 * @returns {Promise<Object>}
 */
const resetSettingsForRole = async (role) => {
  let defaultSettings;
  
  switch (role) {
    case 'admin':
    case 'super-admin':
      defaultSettings = { ...adminNotificationSchema };
      break;
    case 'driver':
      defaultSettings = { ...driverNotificationSchema };
      break;
    default:
      defaultSettings = { ...requestorNotificationSchema };
      break;
  }
  
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
  getOrCreateSettings,
  updateSettings,
  resetSettingsForRole
}; 