const notificationHistoryService = require('../services/notificationHistory.service');
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
    const count = await notificationHistoryService.getUnreadCount(userId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ unreadCount: count })
    };
  } catch (error) {
    console.error('Get unread count error:', error);
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