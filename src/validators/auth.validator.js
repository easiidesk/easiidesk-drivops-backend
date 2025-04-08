const yup = require('yup');

/**
 * Login validation schema
 */
const loginSchema = yup.object().shape({
  phone: yup.string().required('Phone number is required'),
  password: yup.string().required('Password is required'),
  fcm_token: yup.string().nullable()
});

/**
 * Logout validation schema
 */
const logoutSchema = yup.object().shape({
  fcm_token: yup.string().nullable()
});

module.exports = {
  loginSchema,
  logoutSchema
}; 