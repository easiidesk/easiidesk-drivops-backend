const mongoose = require('mongoose');

const adminNotificationSchema = {
  receiveNotification: true,
  receiveDriverPunchIn: true,
  receiveDriverPunchOut: true,
  receiveDriverTripStarted: true,
  receiveDriverTripEnded: true,
  receiveDriverIdle: true
};

const requestorNotificationSchema = {
  receiveNotification: true,
  receiveMyRequestNotification: true,
  receiveMyRequestTripStarted: true,
  receiveMyRequestTripEnded: true
};

const driverNotificationSchema = {
  receiveNotification: true,
  receiveTripScheduledNotfication: true,
  receiveTripScheduleUpdatedNotification: true,
  receiveReminderForUpcomingTrip: true,
  reminderForUpcomingTripTime: 10,
  receiveReminderForPunchOut: true,
};

const userNotificationSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  }
});


module.exports = {
  UserNotificationSettings: mongoose.model('UserNotificationSettings', userNotificationSettingsSchema),
  adminNotificationSchema,
  requestorNotificationSchema,
  driverNotificationSchema
}; 