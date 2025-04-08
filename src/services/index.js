/**
 * Export all services from a single file for easy importing
 */
module.exports = {
  userService: require('./user.service'),
  authService: require('./auth.service'),
  vehicleService: require('./vehicle.service'),
  driverService: require('./driver.service'),
  tripService: require('./trip.service'),
  maintenanceService: require('./maintenance.service')
}; 