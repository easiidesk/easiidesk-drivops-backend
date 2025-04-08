const mongodbService = require('../../../common/services/mongodb.service');
const { ObjectId } = require('mongodb');

class DashboardService {
  async getDashboardCounts() {
    try {
      // Define start and end of today (UTC) - relevant for driver attendance
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setUTCHours(23, 59, 59, 999);

      // Fetch necessary data in parallel
      const [
        activeTrips, // Get the actual schedules to extract busy vehicle IDs
        pendingRequestsCount,
        driversOnDutyCount,
        totalActiveVehiclesCount, // Get total number of active vehicles
      ] = await Promise.all([
        // Get active trips to find busy vehicles
        mongodbService.find('tripSchedules', {
          status: 'in progress', // Use 'started' instead of 'in progress' if that's the correct status
          vehicleId: { $exists: true, $ne: null },
          deletedAt: null,
        }, { projection: { vehicleId: 1 } }), // Only fetch vehicleId
        // Count pending trip requests
        mongodbService.count('tripRequests', {
          status: 'pending',
          deletedAt: null,
        }),
        // Count drivers punched in today but not punched out
        mongodbService.count('driverAttendances', {
          punchIn: { $exists: true, $ne: null },
          punchOut: null,
          isActive: true, // Added isActive check
          deletedAt: null,
        }),
        // Count total number of active vehicles
        mongodbService.count('vehicles', {
            deletedAt: null,
            isInMaintenance: false,
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
        availableVehicles: availableVehiclesCount, // Add the new count
        totalActiveVehicles: totalActiveVehiclesCount, // Optionally return total as well
      };
    } catch (error) {
      console.error('Error fetching dashboard counts:', error);
      throw new Error('Failed to retrieve dashboard counts');
    }
  }
}

module.exports = new DashboardService(); 