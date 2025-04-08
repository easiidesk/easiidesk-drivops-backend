const yup = require('yup');

/**
 * Location schema
 */
const locationSchema = yup.object({
  type: yup.string()
    .oneOf(['Point'], 'Location type must be Point')
    .default('Point'),
  coordinates: yup.array()
    .of(yup.number().required('Coordinate values are required'))
    .min(2, 'Coordinates must have at least longitude and latitude')
    .max(2, 'Coordinates must have only longitude and latitude')
    .required('Coordinates are required'),
  address: yup.string()
    .trim()
});

/**
 * Checkpoint schema
 */
const checkpointSchema = yup.object({
  location: locationSchema.required('Location is required'),
  status: yup.string()
    .oneOf(['reached', 'skipped', 'pending'], 'Invalid checkpoint status')
    .default('pending'),
  notes: yup.string()
    .trim()
});

/**
 * Schema for trip ID parameter
 */
const tripIdParamSchema = yup.object({
  id: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid trip ID format')
    .required('Trip ID is required')
});

/**
 * Schema for checkpoint ID parameters
 */
const checkpointIdParamSchema = yup.object({
  tripId: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid trip ID format')
    .required('Trip ID is required'),
  checkpointId: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid checkpoint ID format')
    .required('Checkpoint ID is required')
});

/**
 * Schema for driver ID parameter
 */
const driverIdParamSchema = yup.object({
  driverId: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid driver ID format')
    .required('Driver ID is required')
});

/**
 * Schema for vehicle ID parameter
 */
const vehicleIdParamSchema = yup.object({
  vehicleId: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle ID format')
    .required('Vehicle ID is required')
});

/**
 * Schema for creating a trip
 */
const createTripSchema = yup.object({
  name: yup.string()
    .trim()
    .required('Trip name is required')
    .min(3, 'Trip name must be at least 3 characters')
    .max(100, 'Trip name must be at most 100 characters'),
  driver: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid driver ID format')
    .required('Driver ID is required'),
  vehicle: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle ID format')
    .required('Vehicle ID is required'),
  startLocation: locationSchema.required('Start location is required'),
  endLocation: locationSchema.required('End location is required'),
  checkpoints: yup.array()
    .of(checkpointSchema),
  scheduledStartTime: yup.date()
    .required('Scheduled start time is required'),
  scheduledEndTime: yup.date()
    .min(
      yup.ref('scheduledStartTime'), 
      'Scheduled end time must be after scheduled start time'
    )
    .required('Scheduled end time is required'),
  purpose: yup.string()
    .trim()
    .max(500, 'Purpose must be at most 500 characters'),
  notes: yup.string()
    .trim()
    .max(500, 'Notes must be at most 500 characters')
});

/**
 * Schema for updating a trip
 */
const updateTripSchema = yup.object({
  name: yup.string()
    .trim()
    .min(3, 'Trip name must be at least 3 characters')
    .max(100, 'Trip name must be at most 100 characters'),
  driver: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid driver ID format'),
  vehicle: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle ID format'),
  startLocation: locationSchema,
  endLocation: locationSchema,
  scheduledStartTime: yup.date(),
  scheduledEndTime: yup.date()
    .min(
      yup.ref('scheduledStartTime'), 
      'Scheduled end time must be after scheduled start time'
    ),
  purpose: yup.string()
    .trim()
    .max(500, 'Purpose must be at most 500 characters'),
  notes: yup.string()
    .trim()
    .max(500, 'Notes must be at most 500 characters')
}).noUnknown(true);

/**
 * Schema for updating a trip status
 */
const updateTripStatusSchema = yup.object({
  status: yup.string()
    .required('Status is required')
    .oneOf(['scheduled', 'in_progress', 'completed', 'cancelled'], 'Invalid status'),
  distance: yup.number()
    .min(0, 'Distance must be a positive number'),
  duration: yup.number()
    .min(0, 'Duration must be a positive number'),
  fuelConsumption: yup.number()
    .min(0, 'Fuel consumption must be a positive number'),
  maintenanceRequired: yup.boolean(),
  maintenanceNotes: yup.string()
    .trim()
    .max(500, 'Maintenance notes must be at most 500 characters')
}).noUnknown(true);

/**
 * Schema for adding a checkpoint
 */
const addCheckpointSchema = yup.object({
  location: locationSchema.required('Location is required'),
  status: yup.string()
    .oneOf(['reached', 'skipped', 'pending'], 'Invalid checkpoint status')
    .default('pending'),
  notes: yup.string()
    .trim()
    .max(500, 'Notes must be at most 500 characters')
}).noUnknown(true);

/**
 * Schema for updating a checkpoint status
 */
const updateCheckpointStatusSchema = yup.object({
  status: yup.string()
    .required('Status is required')
    .oneOf(['reached', 'skipped', 'pending'], 'Invalid checkpoint status'),
  notes: yup.string()
    .trim()
    .max(500, 'Notes must be at most 500 characters')
}).noUnknown(true);

module.exports = {
  tripIdParamSchema,
  checkpointIdParamSchema,
  driverIdParamSchema,
  vehicleIdParamSchema,
  createTripSchema,
  updateTripSchema,
  updateTripStatusSchema,
  addCheckpointSchema,
  updateCheckpointStatusSchema
}; 