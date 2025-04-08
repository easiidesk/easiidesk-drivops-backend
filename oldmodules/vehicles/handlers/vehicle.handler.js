const vehicleService = require('../services/vehicle.service');
const { createVehicleSchema, updateVehicleSchema } = require('../models/vehicle.model');
const { checkVersionValidity } = require('../../../common/utils/version');
// Get all vehicles
exports.getVehicles = async (event) => {
  try {
    const isValidVersion = checkVersionValidity(event);
    if (!isValidVersion) {
      return {
        statusCode: 1000,
        body: JSON.stringify({ message: 'Update your app to the latest version' })
      };
    }

    const vehicles = await vehicleService.getVehicles();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(vehicles)
    };
  } catch (error) {
    console.error('Get vehicles error:', error);
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

// Get vehicle by ID
exports.getVehicleById = async (event) => {
  try {
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

    const vehicle = await vehicleService.getVehicleById(id);
    if (!vehicle) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Vehicle not found' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(vehicle)
    };
  } catch (error) {
    console.error('Get vehicle error:', error);
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

// Create vehicle
exports.createVehicle = async (event) => {
  try {
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
          message: 'Access denied. Only admin and super-admin can create vehicles.'
        })
      };
    }

    const requestBody = JSON.parse(event.body || '{}');
    
    try {
      await createVehicleSchema.validate(requestBody);
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

    const result = await vehicleService.createVehicle(requestBody);
    
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Vehicle created successfully',
        vehicleId: result.insertedId
      })
    };
  } catch (error) {
    console.error('Create vehicle error:', error);
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

// Update vehicle
exports.updateVehicle = async (event) => {
  try {
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
          message: 'Access denied. Only admin and super-admin can update vehicles.'
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
      await updateVehicleSchema.validate(requestBody);
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

    const result = await vehicleService.updateVehicle(id, requestBody);
    
    if (result.matchedCount === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Vehicle not found' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Vehicle updated successfully'
      })
    };
  } catch (error) {
    console.error('Update vehicle error:', error);
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