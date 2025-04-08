const tripScheduleService = require('../services/tripSchedule.service');
const { checkVersionValidity } = require('../../../common/utils/version');

const handler = async (event) => {
  try {
    // Check app version
    const versionCheck = checkVersionValidity(event);
    if (!versionCheck) {
      return {
        statusCode: 426,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: versionCheck.message
        })
      };
    }

    const { vehicleId, driverId, startTime, endTime } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!startTime) {
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

    if (!vehicleId && !driverId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Validation error',
          errors: {
            vehicleId: 'Either vehicleId or driverId is required'
          }
        })
      };
    }
    // Check availability
    const availability = await tripScheduleService.checkAvailability({
      vehicleId,
      driverId,
      startTime,
      endTime
    });

    return  {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(availability)
      };

  } catch (error) {
    console.error('Check availability handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};

module.exports = { handler }; 