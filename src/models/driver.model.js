const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Driver schema
 */
const driverSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    trim: true
  },
  licenseType: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E', 'Commercial']
  },
  licenseExpiry: {
    type: Date,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'suspended'],
    default: 'active'
  },
  vehicle: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalTrips: {
    type: Number,
    default: 0
  },
  documents: [{
    type: {
      type: String,
      enum: ['license', 'id_card', 'insurance', 'medical', 'background_check'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true
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

// Virtual for driver's full name
driverSchema.virtual('fullName').get(function() {
  return `${this.user.name}`;
});

// Add index for common query patterns
driverSchema.index({ licenseNumber: 1 });
driverSchema.index({ user: 1 });
driverSchema.index({ status: 1 });
driverSchema.index({ isAvailable: 1 });
driverSchema.index({ vehicle: 1 });
driverSchema.index({ isActive: 1, deletedAt: 1 });

// Configure toJSON
driverSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver; 