const tripPurposeService = require('../services/tripPurpose.service');
const { createTripPurposeSchema, updateTripPurposeSchema } = require('../models/tripPurpose.model');
const { checkVersionValidity } = require('../../../common/utils/version');

// Get all trip purposes
exports.getTripPurposes = async (event) => {
  try {
    const isValidVersion = checkVersionValidity(event);
    if (!isValidVersion) {
      return {
        statusCode: 1000,
        body: JSON.stringify({ message: 'Update your app to the latest version' })
      };
    }

    const tripPurposes = await tripPurposeService.getTripPurposes();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(tripPurposes)
    };
  } catch (error) {
    console.error('Get trip purposes error:', error);
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

// Get trip purpose by ID
exports.getTripPurposeById = async (event) => {
  try {
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

    const tripPurpose = await tripPurposeService.getTripPurposeById(id);
    if (!tripPurpose) {
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
      body: JSON.stringify(tripPurpose)
    };
  } catch (error) {
    console.error('Get trip purpose error:', error);
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

// Create trip purpose
export const createTripPurpose = async (event) => {
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
          message: 'Access denied. Only admin and super-admin can create trip purposes.'
        })
      };
    }

    const requestBody = JSON.parse(event.body || '{}');
    
    try {
      await createTripPurposeSchema.validate(requestBody);
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

    const result = await tripPurposeService.createTripPurpose(requestBody);
    
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Trip purpose created successfully',
        tripPurposeId: result.insertedId
      })
    };
  } catch (error) {
    console.error('Create trip purpose error:', error);
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

// Update trip purpose
exports.updateTripPurpose = async (event) => {
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

    const requestBody = JSON.parse(event.body || '{}');
    
    try {
      await updateTripPurposeSchema.validate(requestBody);
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

    const result = await tripPurposeService.updateTripPurpose(id, requestBody);
    
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