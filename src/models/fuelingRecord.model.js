/**
 * Fueling Record Model
 * Defines the schema for vehicle fueling records
 */
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

/**
 * Fueling Record Schema
 * Stores information about vehicle refueling events
 */
const fuelingRecordSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  odometer: {
    type: Number,
    required: true,
    min: 0
  },
  fueledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fueledAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  notes: {
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  collection: 'fuelingRecords'
});

// Add indexes for common queries
fuelingRecordSchema.index({ vehicleId: 1, fueledAt: -1 });
fuelingRecordSchema.index({ fueledBy: 1 });
fuelingRecordSchema.index({ isActive: 1 });

// Add plugins
fuelingRecordSchema.plugin(toJSON);
fuelingRecordSchema.plugin(paginate);

// Export the model
const FuelingRecord = mongoose.model('FuelingRecord', fuelingRecordSchema);

module.exports = FuelingRecord; 