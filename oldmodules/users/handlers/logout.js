const userService = require('../services/user.service');

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    const fcmToken = JSON.parse(event.body)?.token;

    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Unauthorized'
        })
      };
    }


    await userService.logout(userId, fcmToken);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Logged out successfully'
      })
    };
  } catch (error) {
    console.error('Logout handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Internal server error'
      })
    };
  }
}; 