const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

/**
 * Trip Request History schema
 * @private
 */
const tripRequestHistorySchema = mongoose.Schema(
  {
    tripRequestId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'TripRequest',
      required: true
    },
    changedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true
    },
    changeType: {
      type: String,
      enum: ['created', 'updated', 'deleted', 'status_changed'],
      required: true
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'tripRequestHistories'
  }
);

// Add plugin that converts mongoose to json
tripRequestHistorySchema.plugin(toJSON);

/**
 * @typedef TripRequestHistory
 */
const TripRequestHistory = mongoose.model('TripRequestHistory', tripRequestHistorySchema);

module.exports = TripRequestHistory; 