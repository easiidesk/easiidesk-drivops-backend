const { TripSchedule, TripRequest, Vehicle } = require('../models');

/**
 * Get dashboard counts and statistics
 * @returns {Promise<Object>} Dashboard statistics
 */
const getDashboardCounts = async () => {
  try {
    // Define start and end of today
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Fetch necessary data in parallel
    const [
      activeTrips,
      pendingRequestsCount,
      driversOnDutyCount,
      totalActiveVehiclesCount,
    ] = await Promise.all([
      // Get active trips to find busy vehicles
      TripSchedule.find(
        { isActive: true, deletedAt: null , status: 'in progress'},
        { vehicleId: 1 }
      ),
      
      // Count pending trip requests
      TripRequest.countDocuments({
        status: 'pending',
        deletedAt: null,
      }),
      
      // Count drivers on duty - using mongoose's aggregation framework
      TripSchedule.countDocuments({
        isActive: true,
        deletedAt: null,
        'destinations.tripStartTime': { $lte: todayEnd },
        'destinations.tripApproxArrivalTime': { $gte: todayStart }
      }),
      
      // Count total number of active vehicles
      Vehicle.countDocuments({
        status: 'active',
        deletedAt: null,
      }),
    ]);

    // Calculate active trips count
    const activeTripsCount = activeTrips.length;

    // Calculate available vehicles
    const busyVehicleIds = new Set(activeTrips.map(trip => trip.vehicleId.toString()));
    const availableVehiclesCount = totalActiveVehiclesCount - busyVehicleIds.size;



    return {
      activeTrips: activeTripsCount,
      pendingRequests: pendingRequestsCount,
      driversOnDuty: driversOnDutyCount,
      availableVehicles: availableVehiclesCount,
      totalActiveVehicles: totalActiveVehiclesCount,
    };
  } catch (error) {
    console.error('Error fetching dashboard counts:', error);
    throw new Error('Failed to retrieve dashboard counts');
  }
};

module.exports = {
  getDashboardCounts
}; 