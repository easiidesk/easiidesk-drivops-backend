const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const adminNotificationSchema = {
  receiveNotification: true,
  receiveDriverPunchIn: true,
  receiveDriverPunchOut: true,
  receiveDriverTripStarted: true,
  receiveDriverTripEnded: true,
  receiveDriverIdle: true,
  receiveTripScheduledNotification: true,
  receiveTripScheduleUpdatedNotification: true,
  receiveTripScheduleCancelledNotification: true,
  receiveTripRequestedNotification: true,
  receiveTripRequestUpdatedNotification: true,
  receiveTripRequestCancelledNotification: true,
  receiveFuelingRecordCreatedNotification: true,
  receiveFuelingRecordUpdatedNotification: true,
  receiveFuelingRecordDeletedNotification: true
};

const requestorNotificationSchema = {
  receiveNotification: true,
  receiveMyRequestTripStarted: true,
  receiveMyRequestTripEnded: true
};

const driverNotificationSchema = {
  receiveNotification: true,
  receiveReminderForUpcomingTrip: true,
  reminderForUpcomingTripTime: 10,
  receiveReminderForPunchOut: true,
};

/**
 * User Notification Settings schema
 * @private
 */
const userNotificationSettingsSchema = mongoose.Schema(
  {
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
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'userNotificationSettings'
  }
);

// Add indexes for common queries
userNotificationSettingsSchema.index({ userId: 1 });
userNotificationSettingsSchema.index({ isActive: 1 });

// Add plugins
userNotificationSettingsSchema.plugin(toJSON);
userNotificationSettingsSchema.plugin(paginate);

/**
 * @typedef UserNotificationSettings
 */
const UserNotificationSettings = mongoose.model('UserNotificationSettings', userNotificationSettingsSchema);

module.exports = {
  UserNotificationSettings,
  adminNotificationSchema,
  requestorNotificationSchema,
  driverNotificationSchema
}; 