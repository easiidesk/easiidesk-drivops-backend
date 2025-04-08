const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  year: {
    type: Number
  },
  licensePlate: {
    type: String,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['car', 'truck', 'van'],
  },
  capacity: {
    type: Number,
    min: 1
  },
  color: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'retired'],
    default: 'active'
  },
  mileage: {
    type: Number,
    default: 0
  },
  registrationExpiry: {
    type: Date
  },
  insuranceExpiry: {
    type: Date
  },
  lastMaintenanceDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
}, {
  timestamps: false, // We're handling timestamps manually
  toJSON: {
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Create indexes for common queries
vehicleSchema.index({ name: 1 });
vehicleSchema.index({ licensePlate: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ assignedDriver: 1 });
vehicleSchema.index({ deletedAt: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle; 