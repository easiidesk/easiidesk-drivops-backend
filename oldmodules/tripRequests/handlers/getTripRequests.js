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
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify([])
      };
    }

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    
    // Build filters
    const filters = {
      status: queryParams.status?.split(','),
      dateFrom: queryParams.dateFrom,
      dateTo: queryParams.dateTo,
      driverId: queryParams.driverId,
      vehicleId: queryParams.vehicleId ? [queryParams.vehicleId] : null,
    };

    console.log(filters);
    // Parse pagination parameters
    const pagination = {
      page: parseInt(queryParams.page) || 1,
      limit: parseInt(queryParams.limit) || 10
    };

    const result = await tripRequestService.getTripRequests(filters, pagination);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Get trip requests error:', error);
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