const yup = require('yup');

// TripPurpose schema for validation
const tripPurposeSchema = yup.object().shape({
  name: yup.string().required('Trip purpose name is required'),
  jobCardNeeded: yup.boolean().required('Job card needed field is required'),
  isActive: yup.boolean().default(true),
  createdAt: yup.date().default(() => new Date()),
  updatedAt: yup.date().default(() => new Date())
});

// Create tripPurpose schema
const createTripPurposeSchema = yup.object().shape({
  name: yup.string().required('Trip purpose name is required'),
  jobCardNeeded: yup.boolean().required('Job card needed field is required'),
  defaultDestination: yup.string().optional()
});

// Update tripPurpose schema
const updateTripPurposeSchema = yup.object().shape({
  name: yup.string().required('Trip purpose name is required'),
  jobCardNeeded: yup.boolean().required('Job card needed field is required'),
  defaultDestination: yup.string().optional()
});

module.exports = {
  tripPurposeSchema,
  createTripPurposeSchema,
  updateTripPurposeSchema
}; 