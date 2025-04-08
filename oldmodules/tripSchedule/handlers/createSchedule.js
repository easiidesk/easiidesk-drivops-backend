const tripScheduleService = require('../services/tripSchedule.service');
const { tripScheduleSchema } = require('../models/tripSchedule.model');
const { success, error } = require('../../../common/utils/http');
const { checkVersionValidity } = require('../../../common/utils/version');
exports.handler = async (event) => {
  try {
    const isValidVersion = checkVersionValidity(event);
    if (!isValidVersion) {
      return {
        statusCode: 1000,
        body: JSON.stringify({ message: 'Update your app to the latest version' })
      };
    }

    const authorizedUser = {
      role: event.requestContext.authorizer?.role,
      userId: event.requestContext.authorizer?.userId
    };

    if (!['admin', 'super-admin', 'scheduler'].includes(authorizedUser.role)) {
      return error('Access denied. Insufficient privileges.', 403);
    }

    const requestBody = JSON.parse(event.body);

    try {
      await tripScheduleSchema.validate(requestBody);
    } catch (validationError) {
      return error(validationError.message, 400);
    }

    const result = await tripScheduleService.createSchedule(requestBody, authorizedUser.userId);
    return success(result);
  } catch (err) {
    console.error('Create schedule error:', err);
    return error(err.message);
  }
}; 