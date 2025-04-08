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

    // Only allow super-admin to reset their settings
    const userRole = event.requestContext.authorizer?.role;
    const userId = event.requestContext.authorizer?.userId;

    if (userRole !== 'super-admin') {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Only super admin can access this endpoint'
        })
      };
    }

    const result = await notificationSettingsService.resetSuperAdminSettings(userId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Super admin notification settings reset successfully',
        settings: result
      })
    };
  } catch (error) {
    console.error('Reset super admin settings error:', error);
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