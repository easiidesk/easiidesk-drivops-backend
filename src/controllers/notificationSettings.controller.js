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
  return null;
}

module.exports = {
  getSettings,
  updateSettings
}; 