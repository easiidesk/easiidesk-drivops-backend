const { status } = require('http-status');
const catchAsync = require('../utils/catchAsync');
const notificationHistoryService = require('../services/notificationHistory.service');
const { successResponse } = require('../common/responses/response.utils');

/**
 * Get notifications for the authenticated user
 * @route GET /notifications
 */
const getNotifications = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const options = req.query;
  
  const result = await notificationHistoryService.getNotifications(userId, options);
  
  return res.status(200).json(successResponse(result));
});

/**
 * Get unread notification count for the authenticated user
 * @route GET /notifications/unread-count
 */
const getUnreadCount = catchAsync(async (req, res) => {
  const userId = req.user._id;
  
  const count = await notificationHistoryService.getUnreadCount(userId);
  
  return res.status(200).json(successResponse(count));
});

/**
 * Mark notifications as read
 * @route POST /notifications/mark-read
 */
const markAsRead = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { notificationIds } = req.body;
  
  const result = await notificationHistoryService.markNotificationsAsRead(userId, notificationIds);
  
  return res.status(status.OK).json(successResponse(result, 'Notifications marked as read')
  );
});

/**
 * Create a notification
 * @route POST /notifications
 */
const createNotification = catchAsync(async (req, res) => {
  const result = await notificationHistoryService.createNotification(req.body);
  
  return res.status(status.CREATED).json(
    successResponse('Notification created successfully', result)
  );
});

/**
 * Delete a notification
 * @route DELETE /notifications/:id
 */
const deleteNotification = catchAsync(async (req, res) => {
  const notificationId = req.params.id;
  
  const result = await notificationHistoryService.deleteNotification(notificationId);
  
  return res.status(status.OK).json(
    successResponse('Notification deleted successfully', result)
  );
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  createNotification,
  deleteNotification
}; 