const userService = require('../services/user.service');
const { success, error } = require('../../../common/utils/http');
const { checkVersionValidity } = require('../../../common/utils/version');
exports.handler = async (event) => {
  try {
    const isValidVersion = checkVersionValidity(event);
    if (!isValidVersion) {
      return {
        statusCode: 1000,
        body: JSON.stringify({ message: 'Update your app to the latest version' })
      };
    }


    // Extract user ID from path parameters
    const userId = event.pathParameters.id;
    
    // Get user from database
    const user = await userService.getUserById(userId);
    
    // Return successful response
    return success(user);
  } catch (err) {
    console.error('Get user error:', err);
    
    // Handle specific errors
    if (err.message === 'User not found') {
      return error('User not found', 404);
    }
    
    // Generic error response
    return error('Internal server error');
  }
}; 