const tripScheduleService = require('../services/tripSchedule.service');
const { success, error } = require('../../../common/utils/http');
const yup = require('yup');
const { checkVersionValidity } = require('../../../common/utils/version');
const { ObjectId } = require('mongodb');

const VALID_STATUSES = ['scheduled', 'in progress', 'completed', 'cancelled'];

const filterSchema = yup.object({
  status: yup.mixed()
    .nullable()
    .test('valid-status', 'Invalid status values', value => {
      if (!value) return true;
      const statuses = Array.isArray(value) ? value : value.split(',').map(s => s.trim());
      return statuses.every(status => VALID_STATUSES.includes(status));
    }),
  dateFrom: yup.mixed()
    .nullable()
    .transform((value) => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date) ? null : date;
    }),
  dateTo: yup.mixed()
    .nullable()
    .transform((value) => {
      if (!value) return null;
      const date = new Date(value);
      return isNaN(date) ? null : date;
    })
    .test('date-range', 'End date must be after start date', function(value) {
      const { dateFrom } = this.parent;
      if (!dateFrom || !value) return true;
      return new Date(value) > new Date(dateFrom);
    }),
  driverId: yup.string().nullable(),
  vehicleId: yup.string().nullable(),
  page: yup.number().nullable().optional(),
  limit: yup.number().nullable().optional()
}).nullable();

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
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify([])
      };
    }
    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    
    // Create filters object with only defined values
    const filters = {};
    
    if (queryParams.status) filters.status = queryParams.status;
    if (queryParams.dateFrom) filters.dateFrom = queryParams.dateFrom;
    if (queryParams.dateTo) filters.dateTo = queryParams.dateTo;
    if (queryParams.driverId) filters.driverId = queryParams.driverId;
    if (queryParams.vehicleId) filters.vehicleId = queryParams.vehicleId;
    if (queryParams.page) filters.page = queryParams.page;
    if (queryParams.limit) filters.limit = queryParams.limit;

    try {
      const validatedFilters = await filterSchema.validate(filters, { 
        abortEarly: false,
        stripUnknown: true
      });

      const schedules = await tripScheduleService.getSchedulesV2(validatedFilters || {});

      return success({
        filters: Object.keys(validatedFilters || {}).length > 0 ? validatedFilters : 'No filters applied',
        data: schedules.results,
        pagination: schedules.pagination
      });
    } catch (validationError) {
      return error(validationError.message, 400);
    }
  } catch (err) {
    console.error('Get schedules error:', err);
    return error(err.message);
  }
}; 