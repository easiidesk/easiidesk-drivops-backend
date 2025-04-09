const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { notificationSettingsService } = require('../services');

const getSettings = catchAsync(async (req, res) => {
  const settings = await notificationSettingsService.getSettings(req.user._id);
  res.send(settings);
});

const updateSettings = catchAsync(async (req, res) => {
  const { settings } = req.body;
  
  if (!settings) {
    res.status(httpStatus.BAD_REQUEST).send({
      message: 'Settings object is required'
    });
    return;
  }

  // Validate settings based on role
  const validationError = validateSettings(req.user.role, settings);
  if (validationError) {
    res.status(httpStatus.BAD_REQUEST).send({
      message: validationError
    });
    return;
  }

  const updatedSettings = await notificationSettingsService.updateSettings(req.user._id, settings);
  res.send({
    message: 'Settings updated successfully',
    settings: updatedSettings
  });
});

function validateSettings(role, settings) {
  const booleanFields = {
    'admin': [
      'receiveNotification',
      'receiveDriverPunchIn',
      'receiveDriverPunchOut',
      'receiveDriverTripStarted',
      'receiveDriverTripEnded',
      'receiveDriverIdle'
    ],
    'super-admin': [
      'receiveNotification',
      'receiveDriverPunchIn',
      'receiveDriverPunchOut',
      'receiveDriverTripStarted',
      'receiveDriverTripEnded',
      'receiveDriverIdle'
    ],
    'scheduler': [
      'receiveNotification',
      'receiveDriverPunchIn',
      'receiveDriverPunchOut',
      'receiveDriverTripStarted',
      'receiveDriverTripEnded',
      'receiveDriverIdle'
    ],
    'requestor': [
      'receiveNotification',
      'receiveMyRequestNotification',
      'receiveMyRequestTripStarted',
      'receiveMyRequestTripEnded'
    ],
    'driver': [
      'receiveReminderForUpcomingTrip',
      'receiveReminderForPunchOut'
    ]
  };

  // Check for invalid fields
  const validFields = [...(booleanFields[role] || [])];
  if (role === 'driver') {
    validFields.push('reminderForUpcomingTripTime');
  }

  const providedFields = Object.keys(settings);
  const invalidFields = providedFields.filter(field => !validFields.includes(field));

  if (invalidFields.length > 0) {
    return `Invalid fields for ${role} role: ${invalidFields.join(', ')}`;
  }

  // Validate boolean fields
  const booleanFieldsForRole = booleanFields[role] || [];
  for (const field of booleanFieldsForRole) {
    if (field in settings && typeof settings[field] !== 'boolean') {
      return `${field} must be a boolean`;
    }
  }

  // Validate reminderForUpcomingTripTime for drivers
  if (role === 'driver' && 'reminderForUpcomingTripTime' in settings) {
    const time = settings.reminderForUpcomingTripTime;
    if (!Number.isInteger(time) || time < 1 || time > 60) {
      return 'reminderForUpcomingTripTime must be an integer between 1 and 60';
    }
  }

  return null;
}

module.exports = {
  getSettings,
  updateSettings
}; 