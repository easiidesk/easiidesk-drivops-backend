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
            'Access-Control-Allow-Origin': '*',
            'Update-Required': 'true'
          },
          body: JSON.stringify({
            message: 'Please update your app to continue'
          })
        };
      }
  

    const { startTime, endTime } = JSON.parse(event.body || '{}');

    if (!startTime) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Start time is required'
        })
      };
    }

    const availability = await tripScheduleService.checkAllAvailability({
      startTime,
      endTime
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(availability)
    };

  } catch (error) {
    console.error('Check all availability handler error:', error);
    return formatErrorResponse(500, error.message);
  }
};

module.exports = { handler }; 