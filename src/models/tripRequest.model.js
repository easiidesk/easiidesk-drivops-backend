const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

/**
 * Trip Request schema
 * @private
 */
const tripRequestSchema = mongoose.Schema(
  {
    destination: {
      type: String,
      required: true,
      trim: true
    },
    mapLink: {
      type: String,
      trim: true
    },
    dateTime: {
      type: Date,
      required: true
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
    noOfPeople: {
      type: Number,
      required: true
    },
    requiredVehicle: {
      type: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Vehicle'
      }],
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'At least one vehicle type is required'
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