const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

/**
 * Notification History schema
 * @private
 */
const notificationHistorySchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed
    },
    isRead: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for common queries
notificationHistorySchema.index({ userId: 1 });
notificationHistorySchema.index({ isRead: 1 });
notificationHistorySchema.index({ createdAt: -1 });

// Add plugins
notificationHistorySchema.plugin(toJSON);
notificationHistorySchema.plugin(paginate);

/**
 * @typedef NotificationHistory
 */
const NotificationHistory = mongoose.model('NotificationHistory', notificationHistorySchema);

module.exports = NotificationHistory; 