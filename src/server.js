// Load environment variables first
require('./config/env');

const { initializeApp, applyRoutes } = require('./config/app');
const database = require('./config/database');

// Import route modules
const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/user.route');
const vehicleRoutes = require('./routes/vehicle.route');
const driverRoutes = require('./routes/driver.route');
const tripRoutes = require('./routes/trip.route');
const maintenanceRoutes = require('./routes/maintenance.route');
const tripRequestRoutes = require('./routes/tripRequest.route');
const tripScheduleRoutes = require('./routes/tripSchedule.route');
const tripPurposeRoutes = require('./routes/tripPurpose.route');
const dashboardRoutes = require('./routes/dashboard.route');
const notificationRoutes = require('./routes/notification.route');
const userNotificationRoutes = require('./routes/userNotification.route');
const driverAttendanceRoutes = require('./routes/driverAttendance.route');

// Initialize Express application
const app = initializeApp();

// Connect to database
database.connect()
  .then(() => console.log('Database connected successfully'))
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// Define routes
const routes = {
  'auth': authRoutes,
  'users': userRoutes,
  'vehicles': vehicleRoutes,
  'drivers': driverRoutes,
  'trips': tripRoutes,
  'maintenance': maintenanceRoutes,
  'trip-requests': tripRequestRoutes,
  'schedules': tripScheduleRoutes,
  'trip-purposes': tripPurposeRoutes,
  'dashboard': dashboardRoutes,
  'notifications': notificationRoutes,
  'notification-settings': userNotificationRoutes,
  'driver-attendance': driverAttendanceRoutes
};

// Apply routes to application
applyRoutes(app, routes);

// Start server
const PORT = process.env.PORT || 4001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
  });
}

// For testing purposes
module.exports = app; 