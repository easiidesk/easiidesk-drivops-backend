/**
 * Maintenance Record Model
 * Defines the schema for vehicle maintenance records
 */
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

/**
 * Maintenance Record Schema
 * Stores information about vehicle maintenance events
 */
const maintenanceRecordSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  maintenanceType: {
    type: String,
    enum: ['preventive', 'corrective', 'scheduled', 'emergency', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  serviceLocation: {
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
  collection: 'maintenanceRecords'
});

// Add indexes for common queries
maintenanceRecordSchema.index({ vehicleId: 1 });
maintenanceRecordSchema.index({ requestedBy: 1 });
maintenanceRecordSchema.index({ approvedBy: 1 });
maintenanceRecordSchema.index({ isActive: 1 });

// Add plugins
maintenanceRecordSchema.plugin(toJSON);
maintenanceRecordSchema.plugin(paginate);

// Export the model
const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);

module.exports = MaintenanceRecord; 