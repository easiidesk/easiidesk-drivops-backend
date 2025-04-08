const express = require('express');
const config = require('../config/config');
const userRoute = require('./user.route');
const authRoute = require('./auth.route');
const vehicleRoute = require('./vehicle.route');
const driverRoute = require('./driver.route');
const tripRoute = require('./trip.route');
const maintenanceRoute = require('./maintenance.route');
const tripRequestRoute = require('./tripRequest.route');
const tripScheduleRoute = require('./tripSchedule.route');
const tripPurposeRoute = require('./tripPurpose.route');
const dashboardRoute = require('./dashboard.route');

const router = express.Router();

// Define API routes using the base route name
const routes = [
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/vehicles',
    route: vehicleRoute,
  },
  {
    path: '/drivers',
    route: driverRoute,
  },
  {
    path: '/trips',
    route: tripRoute,
  },
  {
    path: '/maintenance',
    route: maintenanceRoute,
  },
  {
    path: '/trip-requests',
    route: tripRequestRoute,
  },
  {
    path: '/schedules',
    route: tripScheduleRoute,
  },
  {
    path: '/trip-purposes',
    route: tripPurposeRoute,
  },
  {
    path: '/dashboard',
    route: dashboardRoute,
  },
];

// Add all routes to the router
routes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router; 