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

    const { currentPassword, newPassword } = JSON.parse(event.body) || {};


    // Check if user has required role
    const authorizedUser = {
      role: event.requestContext.authorizer?.role,
      userId: event.requestContext.authorizer?.userId
    };


    // Get user from database
    const users = await userService.changePassword(authorizedUser.userId, currentPassword, newPassword);
    
    // Return successful response
    return success(users);
  } catch (err) {
    console.error('Change password error:', err);
    
    // Handle specific errors
    if (err.message === 'User not found') {
      return error('User not found', 404);
    }
    
    // Generic error response
    return error(err.message);
  }
}; 