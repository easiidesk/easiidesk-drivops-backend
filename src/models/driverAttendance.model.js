/**
 * Driver Attendance Model
 * Defines the schema for the driver attendance collection
 */
const mongoose = require('mongoose');

/**
 * Location Schema
 * For storing location data
 */
const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length === 2;
      },
      message: 'Coordinates must be an array of [longitude, latitude]'
    }
  }
}, { _id: false });

/**
 * Punch Schema
 * Represents a single punch in/out event
 */
const punchSchema = new mongoose.Schema({
  inTime: {
    type: Date,
    required: true
  },
  outTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    default: null
  },
  inLocation: {
    type: locationSchema,
    default: null
  },
  outLocation: {
    type: locationSchema,
    default: null
  }
}, { _id: false });

/**
 * Driver Attendance Schema
 * Stores attendance records for drivers
 */
const driverAttendanceSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  punches: {
    type: [punchSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['not-punched-in', 'punched-in', 'punched-out'],
    default: 'not-punched-in'
  },
  totalHours: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false, // We're handling timestamps manually
  collection: 'driverAttendances'
});

// Create compound index for driver and date
driverAttendanceSchema.index({ driverId: 1, date: 1 }, { unique: true });

// Add index for isActive and date for faster lookups
driverAttendanceSchema.index({ isActive: 1, date: -1 });

// Export the model
const DriverAttendance = mongoose.model('DriverAttendance', driverAttendanceSchema);

module.exports = DriverAttendance; 