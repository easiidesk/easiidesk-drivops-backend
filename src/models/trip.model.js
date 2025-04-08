const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Location schema
 */
const locationSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  },
  address: {
    type: String,
    trim: true
  }
}, { _id: false });

/**
 * Checkpoint schema
 */
const checkpointSchema = new Schema({
  location: {
    type: locationSchema,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['reached', 'skipped', 'pending'],
    default: 'pending'
  },
  notes: String
}, { _id: true });

/**
 * Trip schema
 */
const tripSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  vehicle: {
    type: Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  startLocation: {
    type: locationSchema,
    required: true
  },
  endLocation: {
    type: locationSchema,
    required: true
  },
  checkpoints: [checkpointSchema],
  scheduledStartTime: {
    type: Date,
    required: true
  },
  scheduledEndTime: {
    type: Date
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  distance: {
    type: Number, // in kilometers
    min: 0
  },
  duration: {
    type: Number, // in minutes
    min: 0
  },
  purpose: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  fuelConsumption: {
    type: Number, // in liters
    min: 0
  },
  maintenanceRequired: {
    type: Boolean,
    default: false
  },
  maintenanceNotes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Add indexes for common query patterns
tripSchema.index({ driver: 1, status: 1 });
tripSchema.index({ vehicle: 1, status: 1 });
tripSchema.index({ scheduledStartTime: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ createdBy: 1 });
tripSchema.index({ isActive: 1, deletedAt: 1 });

// Add geospatial indexes for location based queries
tripSchema.index({ 'startLocation.coordinates': '2dsphere' });
tripSchema.index({ 'endLocation.coordinates': '2dsphere' });

// Configure toJSON
tripSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip; 