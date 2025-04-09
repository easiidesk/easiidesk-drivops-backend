/**
 * Export all services from a single file for easy importing
 */
module.exports = {
  userService: require('./user.service'),
  authService: require('./auth.service'),
  vehicleService: require('./vehicle.service'),
  driverService: require('./driver.service'),
  tripService: require('./trip.service'),
  maintenanceService: require('./maintenance.service'),
  tripRequestService: require('./tripRequest.service'),
  tripRequestHistoryService: require('./tripRequestHistory.service'),
  tripScheduleService: require('./tripSchedule.service'),
  notificationHistoryService: require('./notificationHistory.service'),
  notificationSettingsService: require('./notificationSettings.service'),
  dashboardService: require('./dashboard.service'),
  tripPurposeService: require('./tripPurpose.service')
}; 