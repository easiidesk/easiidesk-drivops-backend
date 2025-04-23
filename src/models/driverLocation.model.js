/**
 * Driver Location Model
 * Tracks driver location data for real-time monitoring
 */
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

/**
 * Driver Location Schema
 * Stores location data points for drivers
 */
const driverLocationSchema = mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripSchedule',
      default: null
    },
    source: {
      type: String,
      enum: ['trip', 'attendance', 'background'],
      default: 'background'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'driverLocations'
  }
);

// Add indexes for common queries
driverLocationSchema.index({ driverId: 1, timestamp: -1 });
driverLocationSchema.index({ timestamp: -1 });
driverLocationSchema.index({ location: '2dsphere' });

// Add plugins
driverLocationSchema.plugin(toJSON);
driverLocationSchema.plugin(paginate);

/**
 * @typedef DriverLocation
 */
const DriverLocation = mongoose.model('DriverLocation', driverLocationSchema);

module.exports = DriverLocation; 