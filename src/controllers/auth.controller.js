const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../common/responses/response.utils');

/**
 * User login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const login = async (req, res, next) => {
  try {
    const { phone, password, fcm_token } = req.body;
    
    // Attempt login
    const result = await authService.login(phone, password, fcm_token);
    
    // Return successful response
    return res.status(200).json(successResponse(result, 'Login successful'));
  } catch (err) {
    // Handle specific errors
    if (err.message === 'User not found' || err.message === 'Invalid password') {
      return res.status(401).json(errorResponse('Invalid credentials', 401));
    }
    
    if (err.message === 'User account is inactive') {
      return res.status(403).json(errorResponse('Account is inactive', 403));
    }
    
    // Pass to error handler for generic errors
    next(err);
  }
};

/**
 * User logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const logout = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { token } = req.body;
    
    // Process logout
    await authService.logout(userId, token);
    
    // Return successful response
    return res.status(200).json(successResponse(null, 'Logout successful'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  logout
}; 