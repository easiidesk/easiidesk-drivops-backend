const userService = require('../services/user.service');
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

    // Get authorized user info from requestContext
    const authorizedUser = {
      userId: event.requestContext.authorizer.userId,
      role: event.requestContext.authorizer.role
    };

    // Extract user ID from path parameters
    const requestedUserId = event.pathParameters.id;
    
    // Get user from database (this will check isActive and deletedAt)
    const user = await userService.getUserById(requestedUserId);
    
    // Check if user has permission to access this data
    if (authorizedUser.userId !== requestedUserId && authorizedUser.role !== 'admin') {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Access denied'
        })
      };
    }
    
    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(user)
    };
  } catch (error) {
    console.error('Get user error:', error);
    
    // Handle specific errors
    if (error.message === 'User not found') {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'User not found'
        })
      };
    }
    
    // Generic error response
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Internal server error'
      })
    };
  }
}; 