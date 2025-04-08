const tripRequestService = require('../services/tripRequest.service');
const { createTripRequestSchema } = require('../models/tripRequest.model');
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

    // Check if user has required role
    const authorizedUser = {
      role: event.requestContext.authorizer?.role,
      userId: event.requestContext.authorizer?.userId,
      name: event.requestContext.authorizer?.name
    };

    if (!['admin', 'super-admin', 'requestor', 'scheduler'].includes(authorizedUser.role)) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Access denied. Insufficient privileges.'
        })
      };
    }

    const requestBody = JSON.parse(event.body || '{}');
    
    try {
      await createTripRequestSchema.validate(requestBody);
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

    const result = await tripRequestService.createTripRequest(requestBody, authorizedUser);
    
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Trip request created successfully',
        tripRequestId: result.insertedId
      })
    };
  } catch (error) {
    console.error('Create trip request error:', error);
    return {
      statusCode: error.message.includes('not found') ? 404 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: error.message || 'Internal server error' })
    };
  }
}; 