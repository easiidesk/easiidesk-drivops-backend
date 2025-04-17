const yup = require('yup');

/**
 * Create vehicle validation schema
 */
const createVehicleSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  year: yup.number()
    .optional()
    .min(1900, 'Year must be at least 1900')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  licensePlate: yup.string().optional(),
  type: yup.string()
    .oneOf(['car', 'van', 'truck'], 'Invalid vehicle type')
    .optional(),
  capacity: yup.number()
    .optional(),
  color: yup.string().optional(),
  status: yup.string()
    .oneOf(['active', 'maintenance', 'retired'], 'Invalid status')
    .default('active'),
  mileage: yup.number()
    .min(0, 'Mileage cannot be negative')
    .default(0),
  registrationExpiry: yup.date().optional(),
  insuranceExpiry: yup.date().optional(),
  lastMaintenanceDate: yup.date().nullable(),
  nextMaintenanceDate: yup.date().nullable(),
  assignedDriver: yup.string().nullable()
});

/**
 * Update vehicle validation schema
 */
const updateVehicleSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  year: yup.number()
    .optional()
    .min(1900, 'Year must be at least 1900')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  licensePlate: yup.string().optional().nullable(),
  type: yup.string()
    .oneOf(['car', 'van', 'truck',], 'Invalid vehicle type')
    .optional(),
  capacity: yup.number()
    .optional()
    .min(1, 'Capacity must be at least 1'),
  color: yup.string().optional().nullable(),
  status: yup.string()
    .oneOf(['active', 'maintenance', 'retired'], 'Invalid status')
    .optional(),
  mileage: yup.number()
    .min(0, 'Mileage cannot be negative')
    .optional(),
  registrationExpiry: yup.date().optional(),
  insuranceExpiry: yup.date().optional(),
  lastMaintenanceDate: yup.date().nullable().optional(),
  nextMaintenanceDate: yup.date().nullable().optional(),
  assignedDriver: yup.string().nullable().optional()
});

/**
 * Update vehicle status validation schema
 */
const updateVehicleStatusSchema = yup.object().shape({
  status: yup.string()
    .oneOf(['active', 'maintenance', 'retired'], 'Invalid status')
    .required('Status is required'),
  notes: yup.string().optional()
});

/**
 * Assign driver validation schema
 */
const assignDriverSchema = yup.object().shape({
  driverId: yup.string().required('Driver ID is required')
});

/**
 * Vehicle ID parameter validation schema
 */
const vehicleIdParamSchema = yup.object().shape({
  id: yup.string().required('Vehicle ID is required')
});

module.exports = {
  createVehicleSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  assignDriverSchema,
  vehicleIdParamSchema
}; 