const userService = require('../services/user.service');
const { createUserSchema } = require('../models/user.model');
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
    console.log("event.requestContext.authorizer",event.requestContext.authorizer);
    const authorizedUser = {
      userId: event.requestContext.authorizer.userId,
      role: event.requestContext.authorizer.role
    };

    // Check if user has admin privileges
    if (!['admin', 'super-admin'].includes(authorizedUser.role)) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Access denied. Only admin and super-admin can create users.'
        })
      };
    }

    // Parse request body
    const requestBody = JSON.parse(event.body);
    
    try {
      // Validate request body against schema
      await createUserSchema.validate(requestBody);
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
    if (requestBody.role === 'super-admin' && authorizedUser.role !== 'super-admin') {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Only super-admin can create another super-admin'
        })
      };
    }

    if (!allowedRoles.includes(requestBody.role) && requestBody.role !== 'super-admin') {
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
    const result = await userService.createUser(requestBody);
    
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
    if (error.message === 'Email already exists' || error.message === 'Phone already exists') {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: error.message
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