const userService = require('../services/user.service');
const { updateUserSchema } = require('../models/user.model');
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


    // Parse request body
    const requestBody = JSON.parse(event.body);
    
    try {
      // Validate request body against schema
      await updateUserSchema.validate(requestBody);
    } catch (validationError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Validation error',
          errors: validationError.errors
        })
      };
    }

    

    // Create user
    const result = await userService.updateUser(authorizedUser.userId, requestBody, authorizedUser.userId);
    
    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User updated successfully',
        userId: result.insertedId
      })
    };
   } catch (error) {
    console.error('Update user error:', error);
    
    
    // Generic error response
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: error.message
      })
    };
  }
}; 