const yup = require('yup');

// Vehicle schema for validation
const vehicleSchema = yup.object().shape({
  name: yup.string().required('Vehicle name is required'),
  isActive: yup.boolean().default(true),
  createdAt: yup.date().default(() => new Date()),
  updatedAt: yup.date().default(() => new Date())
});

// Create vehicle schema
const createVehicleSchema = yup.object().shape({
  name: yup.string().required('Vehicle name is required')
});

// Update vehicle schema
const updateVehicleSchema = yup.object().shape({
  name: yup.string().required('Vehicle name is required')
});

// Update maintenance status schema
const updateMaintenanceStatusSchema = yup.object().shape({
  isInMaintenance: yup.boolean().required('Maintenance status is required')
});

module.exports = {
  vehicleSchema,
  createVehicleSchema,
  updateVehicleSchema,
  updateMaintenanceStatusSchema
}; 