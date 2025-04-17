const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

/**
 * Destination Schema for nested documents in trip request
 * @private
 */
const destinationSchema = mongoose.Schema(
  {
    destination: {
      type: String,
      required: true,
      trim: true
    },
    isWaiting: {
      type: Boolean,
      default: false
    },
    purpose: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'TripPurpose',
      required: true
    },
    jobCardId: {
      type: String,
      trim: true
    },
    mapLink: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

/**
 * Trip Request schema
 * @private
 */
const tripRequestSchema = mongoose.Schema(
  {
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
    dateTime: {
      type: Date,
      required: true
    },
    timeType: {
      type: String,
      enum: ['any', 'morning', 'afternoon', 'evening'],
    },
    noOfPeople: {
      type: Number,
      required: true
    },
    requiredVehicle: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      validate: {
        validator: function(arr) {
          if (!arr || arr.length === 0) return false;
          return arr.every(item => {
            // Check if it's a valid vehicle type string
            if (['Any Car', 'Any Van', 'Any Truck'].includes(item)) {
              return true;
            }
            // Check if it's a valid ObjectId
            let isValid = mongoose.Types.ObjectId.isValid(item);
            return isValid;
          });
        },
        message: 'Required vehicle must be either a valid vehicle ID or one of: car, van, truck'
      }
    },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'cancelled'],
      default: 'pending'
    },
    cancelRemarks: {
      type: String,
      default: null
    },
    linkedTripId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'TripSchedule',
      default: null
    },
    createdBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'tripRequests'
  }
);

// Add indexes for common queries
tripRequestSchema.index({ status: 1 });
tripRequestSchema.index({ dateTime: 1 });
tripRequestSchema.index({ createdBy: 1 });
tripRequestSchema.index({ deletedAt: 1 });
tripRequestSchema.index({ linkedTripId: 1 });

// Add plugins
tripRequestSchema.plugin(toJSON);
tripRequestSchema.plugin(paginate);

/**
 * @typedef TripRequest
 */
const TripRequest = mongoose.model('TripRequest', tripRequestSchema);

module.exports = TripRequest; 