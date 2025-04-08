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
      role: event.requestContext.authorizer?.role,
      userId: event.requestContext.authorizer?.userId
    };

    if (!['admin', 'super-admin', 'scheduler'].includes(authorizedUser.role)) {
      return error('Access denied. Insufficient privileges.', 403);
    }

    const { id } = event.pathParameters;
    const result = await tripScheduleService.deleteSchedule(id, authorizedUser.userId);

    if (result.matchedCount === 0) {
      return error('Schedule not found', 404);
    }

    return success({ message: 'Schedule deleted successfully' });
  } catch (err) {
    console.error('Delete schedule error:', err);
    return error(err.message);
  }
}; 