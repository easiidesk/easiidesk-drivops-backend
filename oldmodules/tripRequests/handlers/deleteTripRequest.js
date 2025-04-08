const tripRequestService = require('../services/tripRequest.service');
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
      userId: event.requestContext.authorizer?.userId
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

    const { id } = event.pathParameters || {};
    if (!id) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Trip request ID is required' })
      };
    }

    const result = await tripRequestService.deleteTripRequest(id, authorizedUser.userId);
    
    if (result.matchedCount === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Trip request not found' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Trip request deleted successfully'
      })
    };
  } catch (error) {
    console.error('Delete trip request error:', error);
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