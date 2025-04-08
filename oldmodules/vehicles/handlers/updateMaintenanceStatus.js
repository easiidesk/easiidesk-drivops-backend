const vehicleService = require('../services/vehicle.service');
const { updateMaintenanceStatusSchema } = require('../models/vehicle.model');
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
      role: event.requestContext.authorizer?.role
    };

    if (!['admin', 'super-admin'].includes(authorizedUser.role)) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Access denied. Only admin and super-admin can update maintenance status.'
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
        body: JSON.stringify({ message: 'Vehicle ID is required' })
      };
    }

    const requestBody = JSON.parse(event.body || '{}');

    try {
      await updateMaintenanceStatusSchema.validate(requestBody);
    } catch (validationError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Validation error', errors: validationError.errors })
      };
    }

    await vehicleService.updateMaintenanceStatus(id, requestBody);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Maintenance status updated successfully'
      })
    };
  } catch (error) {
    console.error('Update maintenance status error:', error);
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