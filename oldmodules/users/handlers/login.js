const userService = require('../services/user.service');
const { loginSchema } = require('../models/user.model');
const { success, error } = require('../../../common/utils/http');
const { checkVersionValidity } = require('../../../common/utils/version');
exports.handler = async (event) => {
  try {
    const isValidVersion = checkVersionValidity(event);
    if (!isValidVersion) {
        return error('App Version outdated', 444);
    }
    // Parse request body
    const requestBody = JSON.parse(event.body);
    
    try {
      // Validate request body against schema
      await loginSchema.validate(requestBody);
    } catch (validationError) {
      return error('Validation error', 400, validationError.errors);
    }
    
    // Extract credentials
    const { phone, password, fcm_token } = requestBody;
    
    // Attempt login
    const result = await userService.login(phone, password, fcm_token);
    
    // Return successful response
    return success({success: true,data: result}, 200, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    
    // Handle specific errors
    if (err.message === 'User not found' || err.message === 'Invalid password') {
      return error('Invalid credentials', 401);
    }
    
    if (err.message === 'User account is inactive') {
      return error('Account is inactive', 403);
    }
    
    // Generic error response
    return error('Internal server error');
  }
}; 