/**
 * Export all models from a single file for easy importing
 */
const Maintenance = require('./maintenance.model');
const TripRequest = require('./tripRequest.model');
const TripSchedule = require('./tripSchedule.model');
const NotificationHistory = require('./notificationHistory.model');
const { UserNotificationSettings } = require('./userNotificationSettings.model');
const TripPurpose = require('./tripPurpose.model');
const User = require('./user.model');
const Vehicle = require('./vehicle.model');
const Driver = require('./driver.model');
const Trip = require('./trip.model');
const TripRequestHistory = require('./tripRequestHistory.model');

module.exports = {
  User,
  Vehicle,
  Driver,
  Trip,
  Maintenance,
  TripRequest,
  TripSchedule,
  NotificationHistory,
  UserNotificationSettings,
  TripPurpose,
  TripRequestHistory
};