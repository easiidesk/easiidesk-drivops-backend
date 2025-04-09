const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

/**
 * Maintenance schema
 * @private
 */
const maintenanceSchema = mongoose.Schema(
  {
    vehicle: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    type: {
      type: String,
      enum: ['preventive', 'corrective', 'predictive', 'scheduled', 'emergency'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    servicedBy: {
      type: {
        type: String,
        enum: ['internal', 'external'],
        required: true
      },
      name: {
        type: String,
        required: true,
        trim: true
      },
      contact: {
        type: String,
        trim: true
      },
      cost: {
        type: Number,
        min: 0
      }
    },
    odometer: {
      type: Number,
      min: 0
    },
    cost: {
      type: Number,
      min: 0,
      default: 0
    },
    parts: [
      {
        name: {
          type: String,
          required: true,
          trim: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        cost: {
          type: Number,
          min: 0,
          default: 0
        },
        notes: {
          type: String,
          trim: true
        }
      }
    ],
    scheduledDate: {
      type: Date
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    duration: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    documents: [
      {
        name: {
          type: String,
          required: true,
          trim: true
        },
        type: {
          type: String,
          required: true
        },
        url: {
          type: String,
          required: true
        },
        size: {
          type: Number
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        },
        uploadedBy: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'User'
        }
      }
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function(arr) {
            return arr.length === 2 && 
              arr[0] >= -180 && arr[0] <= 180 && 
              arr[1] >= -90 && arr[1] <= 90;
          },
          message: 'Coordinates must be valid [longitude, latitude]'
        }
      }
    },
    createdBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for common queries
maintenanceSchema.index({ vehicle: 1, status: 1 });
maintenanceSchema.index({ type: 1 });
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ priority: 1 });
maintenanceSchema.index({ scheduledDate: 1 });
maintenanceSchema.index({ createdAt: 1 });

// Add text index for search
maintenanceSchema.index(
  { title: 'text', description: 'text', 'servicedBy.name': 'text', notes: 'text' },
  { weights: { title: 10, description: 5, 'servicedBy.name': 3, notes: 1 } }
);

// Add plugins
maintenanceSchema.plugin(toJSON);
maintenanceSchema.plugin(paginate);

/**
 * @typedef Maintenance
 */
const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

module.exports = Maintenance; 