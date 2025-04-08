const tripScheduleService = require('../services/tripSchedule.service');
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
      role: event.requestContext.authorizer?.role
    };

    if (!['admin', 'super-admin', 'scheduler'].includes(authorizedUser.role)) {
      return error('Access denied. Insufficient privileges.', 403);
    }

    const { id } = event.pathParameters;
    const schedule = await tripScheduleService.getScheduleById(id);

    if (!schedule) {
      return error('Schedule not found', 404);
    }

    return success(schedule);
  } catch (err) {
    console.error('Get schedule by ID error:', err);
    return error(err.message);
  }
}; 