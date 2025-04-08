const notificationService = require('../../../common/services/notification.service');

exports.handler = async (event) => {
  try {
    const { phone, title, body, data } = JSON.parse(event.body);

    // Check if required fields are present
    if (!phone || !title || !body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Phone, title and body are required'
        })
      };
    }

    // Format phone number if needed
    let formattedPhone = phone;
    if (!phone.startsWith('+971')) {
      if (phone.startsWith('971')) {
        formattedPhone = phone.replace('971', '+971');
      } else {
        formattedPhone = '+971' + phone;
      }
    }

    await notificationService.sendNotificationByPhone(formattedPhone, title, body, data);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Notification sent successfully'
      })
    };
  } catch (error) {
    console.error('Send notification error:', error);
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