const httpStatus = require('http-status');
const { NotificationHistory } = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');

/**
 * Get notifications for a user
 * @param {ObjectId} userId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getNotifications = async (userId, options = {}) => {
  const pagination = getPagination(options);
  const filter = { userId, isActive: true };
  
  return NotificationHistory.paginate(filter, {
    ...pagination,
    sort: { createdAt: -1 }
  });
};

/**
 * Get unread notification count for a user
 * @param {ObjectId} userId
 * @returns {Promise<number>}
 */
const getUnreadCount = async (userId) => {
  return NotificationHistory.countDocuments({
    userId,
    isActive: true,
    isRead: false
  });
};

/**
 * Mark notifications as read
 * @param {ObjectId} userId
 * @param {Array<ObjectId>} notificationIds - IDs of notifications to mark read (if empty, mark all as read)
 * @returns {Promise<Object>}
 */
const markNotificationsAsRead = async (userId, notificationIds = []) => {
  const filter = { userId, isActive: true };
  
  if (notificationIds && notificationIds.length > 0) {
    filter._id = { $in: notificationIds };
  } else {
    filter.isRead = false; // Only update unread notifications
  }
  
  const update = {
    isRead: true
  };
  
  const result = await NotificationHistory.updateMany(filter, update);
  
  return {
    success: true,
    modified: result.modifiedCount
  };
};

/**
 * Create a new notification
 * @param {Object} notificationData
 * @returns {Promise<NotificationHistory>}
 */
const createNotification = async (notificationData) => {
  return NotificationHistory.create(notificationData);
};

/**
 * Delete a notification
 * @param {ObjectId} notificationId
 * @returns {Promise<NotificationHistory>}
 */
const deleteNotification = async (notificationId) => {
  const notification = await NotificationHistory.findById(notificationId);
  
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  
  notification.isActive = false;
  await notification.save();
  
  return notification;
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationsAsRead,
  createNotification,
  deleteNotification
}; 