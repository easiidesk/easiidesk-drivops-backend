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
const Trip = require('./trip.model');
const TripRequestHistory = require('./tripRequestHistory.model');
const DriverAttendance = require('./driverAttendance.model');
module.exports = {
  User,
  Vehicle,
  Trip,
  Maintenance,
  TripRequest,
  TripSchedule,
  NotificationHistory,
  UserNotificationSettings,
  TripPurpose,
  TripRequestHistory,
  DriverAttendance
};