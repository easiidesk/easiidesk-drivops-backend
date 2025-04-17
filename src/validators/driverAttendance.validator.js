/**
 * Driver Attendance Validators
 * Validation schemas for driver attendance operations
 */
const yup = require('yup');

/**
 * Driver ID parameter validation
 */
const driverIdParamSchema = yup.object().shape({
  driverId: yup.string()
    .required('Driver ID is required')
    .matches(/^[0-9a-fA-F]{24}$/, 'Driver ID must be a valid MongoDB ID')
});

/**
 * Date range validation for attendance history
 */
const dateRangeSchema = yup.object().shape({
  startDate: yup.date()
    .nullable()
    .transform((value, originalValue) => 
      originalValue === '' ? null : value
    ),
  endDate: yup.date()
    .nullable()
    .transform((value, originalValue) => 
      originalValue === '' ? null : value
    )
    .when('startDate', (startDate, schema) => 
      startDate ? 
        schema.min(startDate, 'End date must be after start date') : 
        schema
    ),
  page: yup.number()
    .integer('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .nullable(),
  limit: yup.number()
    .integer('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .nullable()
});

module.exports = {
  driverIdParamSchema,
  dateRangeSchema
}; 