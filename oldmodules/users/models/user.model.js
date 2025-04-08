const yup = require('yup');

// User schema for validation
const userSchema = yup.object().shape({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  name: yup.string().required('Name is required'),
  role: yup.string().oneOf(['user', 'admin', 'super-admin'], 'Invalid role').required('Role is required'),
  phone: yup.string().nullable(),
  isActive: yup.boolean().default(true),
  createdAt: yup.date().default(() => new Date()),
  updatedAt: yup.date().default(() => new Date())
});

// Login schema for validation
const loginSchema = yup.object().shape({
  phone: yup.string().required('Phone is required'),
  password: yup.string().required('Password is required'),
});

// Create user schema for validation
const createUserSchema = yup.object().shape({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().required('Password is required'),
  name: yup.string().required('Name is required'),
  role: yup.string().oneOf(['requestor', 'scheduler', 'cost-analyst','admin', 'super-admin', 'driver'], 'Invalid role').required('Role is required'),
  phone: yup.string().required('Phone is required')
});

// Update user schema for validation
const updateUserSchema = yup.object().shape({
  email: yup.string().email('Invalid email format').optional(),
  password: yup.string().optional(),
  name: yup.string().optional(),
  role: yup.string().oneOf(['requestor', 'scheduler', 'cost-analyst','admin', 'super-admin', 'driver'], 'Invalid role').optional(),
  phone: yup.string().optional()
});

module.exports = {
  userSchema,
  loginSchema,
  createUserSchema,
  updateUserSchema
}; 