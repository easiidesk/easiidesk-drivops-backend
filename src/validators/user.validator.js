const yup = require('yup');

/**
 * Create user validation schema
 */
const createUserSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  role: yup.string()
    .oneOf(['requestor', 'scheduler', 'cost-analyst', 'admin', 'super-admin', 'driver'], 'Invalid role')
    .required('Role is required')
});

/**
 * Update user validation schema
 */
const updateUserSchema = yup.object().shape({
  name: yup.string().optional(),
  email: yup.string().email('Invalid email format').optional(),
  phone: yup.string().optional(),
  role: yup.string()
    .oneOf(['requestor', 'scheduler', 'cost-analyst', 'admin', 'super-admin', 'driver'], 'Invalid role')
    .optional()
});

/**
 * Change password validation schema
 */
const changePasswordSchema = yup.object().shape({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().min(8, 'New password must be at least 8 characters').required('New password is required')
});

/**
 * Reset password validation schema
 */
const resetPasswordSchema = yup.object().shape({
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
});

/**
 * User ID parameter validation schema
 */
const userIdParamSchema = yup.object().shape({
  id: yup.string().required('User ID is required')
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
  userIdParamSchema
}; 