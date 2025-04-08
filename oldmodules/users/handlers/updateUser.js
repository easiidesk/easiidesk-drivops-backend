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

    const { id } = event.pathParameters || {};

    // Check if user has admin privileges
    if (!['admin', 'super-admin'].includes(authorizedUser.role)) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Access denied. Only admin and super-admin can update users.'
        })
      };
    }

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

    // Check if the role being assigned is valid
    const allowedRoles = ['requestor','scheduler','cost-analyst', 'admin', 'driver'];
    // super-admin can only be created by another super-admin
    if (requestBody.role && requestBody.role === 'super-admin') {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Super admin cannot be updated'
        })
      };
    }

    if (requestBody.role && !allowedRoles.includes(requestBody.role)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Invalid role specified'
        })
      };
    }

    // Create user
    const result = await userService.updateUser(id, requestBody, authorizedUser.userId);
    
    // Return successful response
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User created successfully',
        userId: result.insertedId
      })
    };
   } catch (error) {
    console.error('Create user error:', error);
    
    // Handle specific errors
    if (error.message === 'Email already exists') {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Email already exists'
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