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
    const settings = await notificationSettingsService.getSettings(userId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(settings)
    };
  } catch (error) {
    console.error('Get notification settings error:', error);
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