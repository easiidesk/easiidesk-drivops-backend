const { TripSchedule, TripRequest, Vehicle, User, FuelingRecord } = require('../models');
const DriverAttendance = require('../models/driverAttendance.model');

/**
 * Get dashboard counts and statistics
 * @param {string} requestingUserRole - Role of the requesting user
 * @returns {Promise<Object>} Dashboard statistics
 */
const getDashboardCounts = async (requestingUserRole) => {
  try {
    // Define role-based access control for dashboard metrics
    const canAccess = {
      'activeTrips': ['driver', 'admin', 'super-admin'],
      'pendingRequests': ['requestor', 'scheduler', 'admin', 'super-admin'],
      'driversOnDuty': ['scheduler', 'admin', 'super-admin'],
      'idleDrivers': ['admin', 'super-admin'],
      'tripsToday': ['admin', 'super-admin'],
      'tripsThisWeek': ['admin', 'super-admin'],
      'tripsThisMonth': ['admin', 'super-admin'],
      'fuelingRecordsToday': ['admin', 'super-admin'],
    };

    // Define time periods
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);
    
    // Calculate week start (last Sunday midnight)
    const weekStart = new Date(todayStart);
    const dayOfWeek = weekStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    
    // Calculate month start (1st day of current month)
    const monthStart = new Date(todayStart);
    monthStart.setDate(1);

    // Only fetch data for metrics that the user has access to
    const promises = [];
    const promiseResults = {};

    // Only run queries for data the user can access
    if (canAccess.activeTrips.includes(requestingUserRole)) {
      promises.push(
        TripSchedule.find(
          { isActive: true, deletedAt: null, status: 'in progress'},
          { vehicleId: 1, driverId: 1 }
        ).then(result => { promiseResults.activeTrips = result; })
      );
    }

    if (canAccess.pendingRequests.includes(requestingUserRole)) {
      promises.push(
        TripRequest.countDocuments({
          status: 'pending',
          deletedAt: null,
        }).then(result => { promiseResults.pendingRequestsCount = result; })
      );
    }

    if (canAccess.tripsToday.includes(requestingUserRole)) {
      promises.push(
        TripSchedule.countDocuments({
          isActive: true,
          deletedAt: null,
          $or: [
            { status: 'completed', actualEndTime: { $gte: todayStart, $lte: todayEnd } },
            { status: 'in progress' },
            { 'destinations.tripStartTime': { $gte: todayStart, $lte: todayEnd } }
          ]
        }).then(result => { promiseResults.tripsToday = result; })
      );
    }

    if (canAccess.tripsThisWeek.includes(requestingUserRole)) {
      promises.push(
        TripSchedule.countDocuments({
          isActive: true,
          deletedAt: null,
          $or: [
            { status: 'completed', actualEndTime: { $gte: weekStart, $lte: todayEnd } },
            { status: 'in progress' },
            { 'destinations.tripStartTime': { $gte: weekStart, $lte: todayEnd } }
          ]
        }).then(result => { promiseResults.tripsThisWeek = result; })
      );
    }

    if (canAccess.tripsThisMonth.includes(requestingUserRole)) {
      promises.push(
        TripSchedule.countDocuments({
          isActive: true,
          deletedAt: null,
          $or: [
            { status: 'completed', actualEndTime: { $gte: monthStart, $lte: todayEnd } },
            { status: 'in progress' },
            { 'destinations.tripStartTime': { $gte: monthStart, $lte: todayEnd } }
          ]
        }).then(result => { promiseResults.tripsThisMonth = result; })
      );
    }

    if (canAccess.fuelingRecordsToday.includes(requestingUserRole)) {
      promises.push(
        FuelingRecord.countDocuments({
          isActive: true,
          fueledAt: { $gte: todayStart, $lte: todayEnd }
        }).then(result => { promiseResults.fuelingRecordsToday = result; })
      );
    }

    if (canAccess.driversOnDuty.includes(requestingUserRole) || 
        canAccess.idleDrivers.includes(requestingUserRole)) {
      promises.push(
        DriverAttendance.aggregate([
          {
            $match: {
              isActive: true,
              $or: [
                // Today's punched-in records
                {
                  date: todayStart,
                  status: 'punched-in'
                },
                // Previous days with open punch (no outTime in the last punch)
                {
                  date: { $lt: todayStart },
                  status: 'punched-in',
                  'punches.outTime': null
                }
              ]
            }
          },
          {
            $group: {
              _id: '$driverId'
            }
          }
        ]).then(result => { promiseResults.punchedInDriverIds = result; })
      );
    }

    // Execute only the required queries
    await Promise.all(promises);

    // Process results and build the response
    const response = {};

    if (canAccess.activeTrips.includes(requestingUserRole)) {
      const activeTripsCount = promiseResults.activeTrips.length;
      response.activeTrips = activeTripsCount;
    }

    if (canAccess.driversOnDuty.includes(requestingUserRole)) {
      const punchedInDriverIds = promiseResults.punchedInDriverIds || [];
      response.driversOnDuty = punchedInDriverIds.length;
    }

    if (canAccess.idleDrivers.includes(requestingUserRole) && 
        promiseResults.punchedInDriverIds && 
        promiseResults.activeTrips) {
      
      const driversWithActiveTrips = new Set(
        promiseResults.activeTrips
          .map(trip => trip.driverId ? trip.driverId.toString() : null)
          .filter(Boolean)
      );
      
      const idleDrivers = promiseResults.punchedInDriverIds.filter(
        driver => !driversWithActiveTrips.has(driver._id.toString())
      );
      
      response.idleDrivers = idleDrivers.length;
    }

    if (canAccess.pendingRequests.includes(requestingUserRole)) {
      response.pendingRequests = promiseResults.pendingRequestsCount;
    }

    if (canAccess.tripsToday.includes(requestingUserRole)) {
      response.tripsToday = promiseResults.tripsToday;
    }

    if (canAccess.tripsThisWeek.includes(requestingUserRole)) {
      response.tripsThisWeek = promiseResults.tripsThisWeek;
    }

    if (canAccess.tripsThisMonth.includes(requestingUserRole)) {
      response.tripsThisMonth = promiseResults.tripsThisMonth;
    }

    if (canAccess.fuelingRecordsToday.includes(requestingUserRole)) {
      response.fuelingRecordsToday = promiseResults.fuelingRecordsToday;
    }

    return response;
  } catch (error) {
    console.error('Error fetching dashboard counts:', error);
    throw new Error('Failed to retrieve dashboard counts');
  }
};

module.exports = {
  getDashboardCounts
}; 