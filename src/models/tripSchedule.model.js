const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

/**
 * Destination Schema for nested documents in trip schedule
 * @private
 */
const destinationSchema = mongoose.Schema(
  {
    requestId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'TripRequest',
      default: null
    },
    tripStartTime: {
      type: Date,
      required: true
    },
    tripApproxArrivalTime: {
      type: Date
    },
    tripPurposeTime: {
      type: Number
    }
  },
  { _id: true }
);

/**
 * Trip Schedule schema
 * @private
 */
const tripScheduleSchema = mongoose.Schema(
  {
    driverId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true
    },
    vehicleId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Vehicle',
      required: true
    },
    destinations: {
      type: [destinationSchema],
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'At least one destination is required'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      default: null
    },
    createdBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'tripSchedules'
  }
);

// Add indexes for common queries
tripScheduleSchema.index({ driverId: 1 });
tripScheduleSchema.index({ vehicleId: 1 });
tripScheduleSchema.index({ isActive: 1 });
tripScheduleSchema.index({ deletedAt: 1 });
tripScheduleSchema.index({ 'destinations.tripStartTime': 1 });

// Add plugins
tripScheduleSchema.plugin(toJSON);
tripScheduleSchema.plugin(paginate);

/**
 * @typedef TripSchedule
 */
const TripSchedule = mongoose.model('TripSchedule', tripScheduleSchema);

module.exports = TripSchedule; 