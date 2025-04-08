const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

/**
 * Trip Purpose schema
 * @private
 */
const tripPurposeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    jobCardNeeded: {
      type: Boolean,
      required: true
    },
    defaultDestination: {
      type: String,
      trim: true
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
    }
  },
  {
    timestamps: true,
    collection: 'tripPurposes'
  }
);

// Add indexes for common queries
tripPurposeSchema.index({ name: 1 });
tripPurposeSchema.index({ isActive: 1 });
tripPurposeSchema.index({ jobCardNeeded: 1 });

// Add plugins
tripPurposeSchema.plugin(toJSON);
tripPurposeSchema.plugin(paginate);

/**
 * @typedef TripPurpose
 */
const TripPurpose = mongoose.model('TripPurpose', tripPurposeSchema);

module.exports = TripPurpose; 