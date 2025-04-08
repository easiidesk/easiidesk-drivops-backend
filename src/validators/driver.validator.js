const yup = require('yup');

/**
 * Schema for driver ID parameter
 */
const driverIdParamSchema = yup.object({
  id: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid driver ID format')
    .required('Driver ID is required')
});

/**
 * Schema for document ID parameter
 */
const documentIdParamSchema = yup.object({
  driverId: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid driver ID format')
    .required('Driver ID is required'),
  documentId: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid document ID format')
    .required('Document ID is required')
});

/**
 * Schema for creating a driver
 */
const createDriverSchema = yup.object({
  user: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
    .required('User ID is required'),
  licenseNumber: yup.string()
    .trim()
    .required('License number is required')
    .min(5, 'License number must be at least 5 characters')
    .max(20, 'License number must be at most 20 characters'),
  licenseType: yup.string()
    .required('License type is required')
    .oneOf(['A', 'B', 'C', 'D', 'E', 'Commercial'], 'Invalid license type'),
  licenseExpiry: yup.date()
    .required('License expiry date is required')
    .min(new Date(), 'License must not be expired'),
  status: yup.string()
    .oneOf(['active', 'inactive', 'on_leave', 'suspended'], 'Invalid status')
    .default('active'),
  vehicle: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle ID format')
    .nullable(),
  isAvailable: yup.boolean()
    .default(true),
  notes: yup.string()
    .trim()
    .max(500, 'Notes must be at most 500 characters')
    .nullable()
});

/**
 * Schema for updating a driver
 */
const updateDriverSchema = yup.object({
  licenseNumber: yup.string()
    .trim()
    .min(5, 'License number must be at least 5 characters')
    .max(20, 'License number must be at most 20 characters'),
  licenseType: yup.string()
    .oneOf(['A', 'B', 'C', 'D', 'E', 'Commercial'], 'Invalid license type'),
  licenseExpiry: yup.date(),
  isAvailable: yup.boolean(),
  vehicle: yup.string()
    .matches(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle ID format')
    .nullable()
    .default(null),
  notes: yup.string()
    .trim()
    .max(500, 'Notes must be at most 500 characters')
}).noUnknown(true);

/**
 * Schema for updating driver status
 */
const updateDriverStatusSchema = yup.object({
  status: yup.string()
    .required('Status is required')
    .oneOf(['active', 'inactive', 'on_leave', 'suspended'], 'Invalid status'),
  notes: yup.string()
    .trim()
    .max(500, 'Notes must be at most 500 characters')
}).noUnknown(true);

/**
 * Schema for adding a document
 */
const addDocumentSchema = yup.object({
  type: yup.string()
    .required('Document type is required')
    .oneOf(['license', 'id_card', 'insurance', 'medical', 'background_check'], 'Invalid document type'),
  url: yup.string()
    .required('Document URL is required')
    .url('Invalid URL format'),
  verified: yup.boolean()
    .default(false)
}).noUnknown(true);

module.exports = {
  driverIdParamSchema,
  documentIdParamSchema,
  createDriverSchema,
  updateDriverSchema,
  updateDriverStatusSchema,
  addDocumentSchema
}; 