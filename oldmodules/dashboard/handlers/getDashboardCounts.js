const dashboardService = require('../services/dashboard.service');
const { checkVersionValidity } = require('../../../common/utils/version'); // Assuming you have this utility

const handler = async (event) => {
  try {
    // Optional: Check app version if needed
    const versionCheck = checkVersionValidity(event);
    if (!versionCheck) {
        return {
            statusCode: 1000,
            body: JSON.stringify({ message: 'Update your app to the latest version' })
          };
    }

    // Check authorization (user should be logged in)
    // Assuming verifyToken adds auth context to event.requestContext.authorizer
    if (!event.requestContext?.authorizer?.userId) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Unauthorized' })
          };
    }

    const userRole = event.requestContext.authorizer.role;
    if (!['scheduler','admin', 'super-admin'].includes(userRole)) { 
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Forbidden: Insufficient permissions' })
          };
    }

    const counts = await dashboardService.getDashboardCounts();

    return {
        statusCode: 200,
        body: JSON.stringify(counts)
      };

  } catch (error) {
    console.error('Get dashboard counts handler error:', error);
    return formatErrorResponse(500, error.message || 'Internal server error');
  }
};

module.exports = { handler }; 