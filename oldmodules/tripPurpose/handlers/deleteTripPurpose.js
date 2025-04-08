const tripPurposeService = require('../services/tripPurpose.service');
const { updateTripPurposeSchema } = require('../models/tripPurpose.model');
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

    // Check if user has admin privileges
    const authorizedUser = {
      role: event.requestContext.authorizer?.role,
      userId: event.requestContext.authorizer?.userId
    };

    if (!['admin', 'super-admin'].includes(authorizedUser.role)) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Access denied. Only admin and super-admin can update trip purposes.'
        })
      };
    }

    const { id } = event.pathParameters || {};
    if (!id) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Trip purpose ID is required' })
      };
    }


    const result = await tripPurposeService.deleteTripPurpose(id, authorizedUser.userId);
    
    if (result.matchedCount === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Trip purpose not found' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Trip purpose updated successfully'
      })
    };
  } catch (error) {
    console.error('Update trip purpose error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}; 