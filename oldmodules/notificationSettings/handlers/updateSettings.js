const notificationSettingsService = require('../services/notificationSettings.service');
const { checkVersionValidity } = require('../../../common/utils/version');

exports.handler = async (event) => {
  try {
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

    const userId = event.requestContext.authorizer?.userId;
    const userRole = event.requestContext.authorizer?.role;
    const { settings } = JSON.parse(event.body);

    if (!settings) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Settings object is required'
        })
      };
    }

    // Validate settings based on role
    const validationError = validateSettings(userRole, settings);
    if (validationError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: validationError
        })
      };
    }

    const updatedSettings = await notificationSettingsService.updateUserSettings(userId, settings);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Settings updated successfully',
        settings: updatedSettings
      })
    };
  } catch (error) {
    console.error('Update notification settings error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: error.message || 'Internal server error'
      })
    };
  }
};

function validateSettings(role, settings) {
  const booleanFields = {
    'admin': [
      'receiveNotification',
      'receiveDriverPunchIn',
      'receiveDriverPunchOut',
      'receiveDriverTripStarted',
      'receiveDriverTripEnded',
      'receiveDriverIdle'
    ],
    'super-admin': [
      'receiveNotification',
      'receiveDriverPunchIn',
      'receiveDriverPunchOut',
      'receiveDriverTripStarted',
      'receiveDriverTripEnded',
      'receiveDriverIdle'
    ],
    'scheduler': [
      'receiveNotification',
      'receiveDriverPunchIn',
      'receiveDriverPunchOut',
      'receiveDriverTripStarted',
      'receiveDriverTripEnded',
      'receiveDriverIdle'
    ],
    'requestor': [
      'receiveNotification',
      'receiveMyRequestNotification',
      'receiveMyRequestTripStarted',
      'receiveMyRequestTripEnded'
    ],
    'driver': [
      'receiveReminderForUpcomingTrip',
      'receiveReminderForPunchOut'
    ]
  };

  // Check for invalid fields
  const validFields = [...(booleanFields[role] || [])];
  if (role === 'driver') {
    validFields.push('reminderForUpcomingTripTime');
  }

  const providedFields = Object.keys(settings);
  const invalidFields = providedFields.filter(field => !validFields.includes(field));

  if (invalidFields.length > 0) {
    return `Invalid fields for ${role} role: ${invalidFields.join(', ')}`;
  }

  // Validate boolean fields
  const booleanFieldsForRole = booleanFields[role] || [];
  for (const field of booleanFieldsForRole) {
    if (field in settings && typeof settings[field] !== 'boolean') {
      return `${field} must be a boolean`;
    }
  }

  // Validate reminderForUpcomingTripTime for drivers
  if (role === 'driver' && 'reminderForUpcomingTripTime' in settings) {
    const time = settings.reminderForUpcomingTripTime;
    if (!Number.isInteger(time) || time < 1 || time > 60) {
      return 'reminderForUpcomingTripTime must be an integer between 1 and 60';
    }
  }

  return null;
} 