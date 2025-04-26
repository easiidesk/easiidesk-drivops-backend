/**
 * Driver Attendance Service
 * Manages driver attendance, punch in/out, and attendance history
 */
const { ObjectId } = require('mongoose').Types;
const User = require('../models/user.model');
const DriverAttendance = require('../models/driverAttendance.model');
const notificationService = require('../common/services/notification.service');
const { sendNotificationsToRoles, formatDriverPunchInNotification, formatDriverPunchOutNotification } = require('../utils/notifcationHelper');
const TripSchedule = require('../models/tripSchedule.model');
const DriverLocation = require('./driverLocation.service');

class DriverAttendanceService {
  /**
   * Get current punch status for a driver
   * @param {string} userId - Driver ID
   * @returns {Object} Punch status information
   */
  async getDriverPunchStatus(userId) {
    try {
      // Verify driver exists
      const driver = await User.findOne({
        _id: userId,
        role: 'driver',
        isActive: true,
        deletedAt: null
      });

      if (!driver) {
        throw new Error('Driver not found');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // First check for today's attendance
      let attendance = await DriverAttendance.findOne({
        driverId: userId,
        date: today,
        isActive: true
      });

      // If no attendance for today or no open punch, check for active punch from previous days
      if (!attendance || !attendance.punches || attendance.punches.length === 0 || 
          (attendance.punches[attendance.punches.length - 1].outTime !== null)) {
        
        // Look for any previous attendance with an open punch (no outTime)
        const previousAttendance = await DriverAttendance.findOne({
          driverId: userId,
          date: { $lt: today },
          status: 'punched-in',
          isActive: true,
          'punches.outTime': null
        }).sort({ date: -1 }); // Get the most recent one

        // If found a previous attendance with open punch, use it
        if (previousAttendance && 
            previousAttendance.punches && 
            previousAttendance.punches.length > 0) {
          attendance = previousAttendance;
        }
      }

      // If still no attendance with open punch found
      if (!attendance || !attendance.punches || attendance.punches.length === 0) {
        return {
          isPunchedIn: false,
          status: 'not-punched-in',
          timeSincePunchIn: null,
          punchInTime: null,
          punchOutTime: null,
          totalHours: 0,
          punches: []
        };
      }

      const lastPunch = attendance.punches[attendance.punches.length - 1];
      const now = new Date();
      const timeSincePunchIn = !lastPunch.outTime 
        ? Math.floor((now - lastPunch.inTime) / 1000) // time in seconds
        : null;

      return {
        isPunchedIn: !lastPunch.outTime,
        status: !lastPunch.outTime ? 'punched-in' : 'punched-out',
        timeSincePunchIn,
        punchInTime: lastPunch.inTime,
        punchOutTime: lastPunch.outTime,
        totalHours: attendance.totalHours || 0,
        punches: attendance.punches.map(punch => ({
          inTime: punch.inTime,
          outTime: punch.outTime,
          duration: punch.duration
        }))
      };
    } catch (error) {
      console.error('Get driver punch status error:', error);
      throw error;
    }
  }

  /**
   * Punch in a driver
   * @param {string} driverId - Driver ID
   * @param {Object} punchData - Additional punch data like location
   * @returns {Promise<Object>} Updated attendance record
   */
  async punchIn(driverId, punchData = {}) {
    // Verify driver exists
    const driver = await User.findOne({
      _id: driverId,
      role: 'driver',
      isActive: true,
      deletedAt: null
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's an existing attendance record for today
    let attendance = await DriverAttendance.findOne({
      driverId: driverId,
      date: today,
      isActive: true
    });

    // Check if last punch was a punch-in without punch-out
    if (attendance && attendance.punches && attendance.punches.length > 0) {
      const lastPunch = attendance.punches[attendance.punches.length - 1];
      if (!lastPunch.outTime) {
        throw new Error('Already punched in');
      }
    }

    // Add new punch-in with location if provided
    const newPunch = {
      inTime: new Date(),
      outTime: null
    };

    // Add location if provided
    if (punchData.coordinates && Array.isArray(punchData.coordinates) && punchData.coordinates.length === 2) {
      newPunch.inLocation = {
        type: 'Point',
        coordinates: punchData.coordinates
      };
    }

    if (attendance) {
      // Update existing attendance record
      attendance.punches.push(newPunch);
      attendance.status = 'punched-in';
      attendance.updatedAt = new Date();
      await attendance.save();
    } else {
      // Create new attendance record
      attendance = new DriverAttendance({
        driverId: driverId,
        date: today,
        punches: [newPunch],
        status: 'punched-in',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await attendance.save();
    }

    // Record location in the driver location tracking system if coordinates provided
    if (punchData.coordinates) {
      try {
        
        DriverLocation.recordLocation({
          driverId,
          coordinates: punchData.coordinates,
          source: 'attendance'
        });
      } catch (error) {
        // Log but don't fail the punch in if location recording fails
        console.error('Failed to record attendance location:', error);
      }
    }

    // Notify all schedulers-admins-super-admins
    sendNotificationsToRoles(['admin', 'super-admin'], ['receiveDriverPunchIn'], `Driver Punch IN`, formatDriverPunchInNotification(driver.name), {
      driverId: driverId.toString(),
      type: 'driver_punch_in',
      time: new Date().toISOString()
    }).catch(error => {
      console.error('Send notification error:', error);
    });

    return true;
  }

  /**
   * Punch out a driver
   * @param {string} driverId - Driver ID
   * @param {Object} punchData - Additional punch data like location
   * @returns {Promise<Object>} Updated attendance record
   */
  async punchOut(driverId, punchData = {}) {
    // Verify driver exists
    const driver = await User.findOne({
      _id: driverId,
      role: 'driver',
      isActive: true,
      deletedAt: null
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    // Check if driver has any in-progress trips

    const activeTrips = await TripSchedule.findOne({
      driverId: driverId,
      status: 'in progress',
      isActive: true,
      deletedAt: null
    });

    if (activeTrips) {
      throw new Error('Cannot punch out while you have trips in progress. Please complete all trips first.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First check today's attendance record
    let attendance = await DriverAttendance.findOne({
      driverId: driverId,
      date: today,
      status: 'punched-in',
      isActive: true
    });

    // If no active punch-in found for today, check previous days
    if (!attendance || !attendance.punches || attendance.punches.length === 0 || 
        attendance.punches[attendance.punches.length - 1].outTime !== null) {
      
      attendance = await DriverAttendance.findOne({
        driverId: driverId,
        date: { $lt: today },
        status: 'punched-in',
        isActive: true,
        'punches.outTime': null
      }).sort({ date: -1 }); // Get the most recent one
    }

    if (!attendance || !attendance.punches || attendance.punches.length === 0) {
      throw new Error('No active punch-in found');
    }

    // Get the last punch
    const lastPunchIndex = attendance.punches.length - 1;
    const lastPunch = attendance.punches[lastPunchIndex];

    if (lastPunch.outTime) {
      throw new Error('Already punched out');
    }

    // Calculate duration for this punch
    const outTime = new Date();
    const duration = (outTime - lastPunch.inTime) / (1000 * 60 * 60); // hours

    // Update the last punch with out time, duration, and location if provided
    attendance.punches[lastPunchIndex].outTime = outTime;
    attendance.punches[lastPunchIndex].duration = duration;

    // Add location if provided
    if (punchData.coordinates && Array.isArray(punchData.coordinates) && punchData.coordinates.length === 2) {
      attendance.punches[lastPunchIndex].outLocation = {
        type: 'Point',
        coordinates: punchData.coordinates
      };
    }

    // Calculate total hours for the day
    const totalHours = attendance.punches.reduce((total, punch) => {
      return total + (punch.duration || 0);
    }, 0);

    // Update attendance
    attendance.status = 'punched-out';
    attendance.totalHours = totalHours;
    attendance.updatedAt = new Date();
    await attendance.save();

    // Record location in the driver location tracking system if coordinates provided
    if (punchData.coordinates) {
      try {

        DriverLocation.recordLocation({
          driverId,
          coordinates: punchData.coordinates,
          source: 'attendance'
        });
      } catch (error) {
        // Log but don't fail the punch out if location recording fails
        console.error('Failed to record attendance location:', error);
      }
    }

    // Notify all schedulers-admins-super-admins
    sendNotificationsToRoles(['admin', 'super-admin'], ['receiveDriverPunchOut'], `Driver Punch OUT`, await formatDriverPunchOutNotification(attendance, driverId, driver.name), {
      type: 'driver_punch_out',
      driverId: driverId.toString(),
      driverName: driver.name
    }).catch(error => {
      console.error('Send notification error:', error);
    });

    return true;
  }

  /**
   * Get count of drivers who are currently punched in
   * @returns {Object} Count of punched-in drivers and other stats
   */
  async getPunchedInDriversCount(currentUserRole) {
    try {
      let showLocation = false;
      if (currentUserRole === 'admin' || currentUserRole === 'super-admin') {
        showLocation = true;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find all currently punched-in drivers, using the same logic as getDriverPunchStatus
      // This includes:
      // 1. Drivers who punched in today and haven't punched out
      // 2. Drivers who punched in on a previous day and haven't punched out yet

      // First get today's attendance records with punched-in status
      const todayPunchedInAttendances = await DriverAttendance.find({
        date: today,
        status: 'punched-in',
        isActive: true,
        'punches.outTime': null // At least one punch without an outTime
      }).lean();
      
      // Then get previous days' attendance records with no punch-out
      const previousDaysPunchedInAttendances = await DriverAttendance.find({
        date: { $lt: today },
        status: 'punched-in',
        isActive: true,
        'punches.outTime': null // At least one punch without an outTime
      }).lean();
      
      // Combine both sets but ensure no duplicate drivers
      const driverIdMap = new Map();
      
      // Process today's attendance records first
      todayPunchedInAttendances.forEach(attendance => {
        const driverId = attendance.driverId.toString();
        if (!driverIdMap.has(driverId)) {
          driverIdMap.set(driverId, attendance);
        }
      });
      
      // Then add previous days' records if driver not already included
      previousDaysPunchedInAttendances.forEach(attendance => {
        const driverId = attendance.driverId.toString();
        if (!driverIdMap.has(driverId)) {
          driverIdMap.set(driverId, attendance);
        }
      });
      
      // Convert map values to array of attendance records
      const punchedInAttendances = Array.from(driverIdMap.values());
      
      // Count of currently punched-in drivers
      const punchedInCount = punchedInAttendances.length;
      
      // Get all attendance records for today (including punched out)
      const punchedInTodayCount = await DriverAttendance.countDocuments({
        date: today,
        isActive: true
      });
      
      // Get total number of active drivers
      const totalDrivers = await User.countDocuments({
        role: 'driver',
        isActive: true,
        deletedAt: null
      });
      
      // Get driver details for drivers who are punched in
      const driverIds = punchedInAttendances.map(a => a.driverId);
      const drivers = await User.find({
        _id: { $in: driverIds }
      }).select('name phone lastLocation').lean();
      
      // Create a map of driver data keyed by driver ID
      const driverMap = {};
      drivers.forEach(driver => {
        driverMap[driver._id.toString()] = {
          name: driver.name,
          phone: driver.phone || null,
          lastLocation: showLocation ? (driver.lastLocation || null) : null
        };
      });
      
      // Enrich attendance records with driver information
      const punchedInDrivers = punchedInAttendances.map(attendance => {
        const driverId = attendance.driverId.toString();
        
        // Get the last punch (the one without an outTime)
        const lastPunch = attendance.punches?.length > 0 
          ? attendance.punches.find(p => !p.outTime) || attendance.punches[attendance.punches.length - 1]
          : null;
          
        return {
          driverId,
          ...driverMap[driverId],
          punchInTime: showLocation ? lastPunch?.inTime || null : null
        };
      });
      
      // Sort drivers by punch-in time (most recent first)
      punchedInDrivers.sort((a, b) => {
        if (!a.punchInTime) return 1;
        if (!b.punchInTime) return -1;
        return b.punchInTime - a.punchInTime;
      });
      
      return {
        punchedInCount,
        totalDrivers,
        punchedInTodayCount,
        punchedInDrivers
      };
    } catch (error) {
      console.error('Get punched-in drivers count error:', error);
      throw error;
    }
  }

  /**
   * Get all driver attendance records
   * @param {Object} options - Query options (page, limit, date, driverId)
   * @returns {Object} Paginated attendance records
   */
  async getAllDriverAttendance({ page = 1, limit = 10, date, driverId }) {
    const skip = (page - 1) * limit;
    const filter = { isActive: true };

    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      filter.date = queryDate;
    }

    if (driverId) {
      filter.driverId = driverId;
    }

    const [attendances, totalCount] = await Promise.all([
      DriverAttendance.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      DriverAttendance.countDocuments(filter)
    ]);

    // Get driver details for each attendance record
    const driverIds = attendances.map(a => a.driverId);
    const drivers = await User.find({ _id: { $in: driverIds } });

    const driversMap = drivers.reduce((map, driver) => {
      map[driver._id.toString()] = {
        name: driver.name,
        phone: driver.phone,
        email: driver.email
      };
      return map;
    }, {});

    const enrichedAttendances = attendances.map(attendance => {
      const attendanceObj = attendance.toObject();
      return {
        ...attendanceObj,
        driver: driversMap[attendance.driverId.toString()] || null
      };
    });

    return {
      data: enrichedAttendances,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Get attendance history for a driver
   * @param {string} driverId - Driver ID
   * @param {Object} options - Query options (startDate, endDate, page, limit)
   * @returns {Object} Paginated attendance history
   */
  async getDriverAttendanceHistory(driverId, { startDate, endDate, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const filter = { 
      driverId: driverId,
      isActive: true 
    };

    // Apply date filters if provided
    if (startDate || endDate) {
      filter.date = {};
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.date.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const [attendances, totalCount] = await Promise.all([
      DriverAttendance.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      DriverAttendance.countDocuments(filter)
    ]);

    // Convert Mongoose documents to plain objects
    const attendanceObjects = attendances.map(attendance => attendance.toObject());

    // Calculate total hours across all days in the result
    const totalHours = attendanceObjects.reduce((total, attendance) => {
      return total + (attendance.totalHours || 0);
    }, 0);

    return {
      data: attendanceObjects,
      summary: {
        totalHours,
        totalDays: attendanceObjects.length,
        averageHoursPerDay: attendanceObjects.length > 0 ? totalHours / attendanceObjects.length : 0
      },
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Get all drivers who are punched in but not assigned to any active trips
   * @param {string} currentUserRole - The role of the user making the request
   * @returns {Promise<Object>} Idle drivers with their details
   */
  async getIdleDrivers(currentUserRole) {
    try {
      let showLocation = false;
      if (currentUserRole === 'admin' || currentUserRole === 'super-admin') {
        showLocation = true;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find all currently punched-in drivers using the same logic as getPunchedInDriversCount
      // First get today's attendance records with punched-in status
      const todayPunchedInAttendances = await DriverAttendance.find({
        date: today,
        status: 'punched-in',
        isActive: true,
        'punches.outTime': null // At least one punch without an outTime
      }).lean();
      
      // Then get previous days' attendance records with no punch-out
      const previousDaysPunchedInAttendances = await DriverAttendance.find({
        date: { $lt: today },
        status: 'punched-in',
        isActive: true,
        'punches.outTime': null // At least one punch without an outTime
      }).lean();
      
      // Combine both sets but ensure no duplicate drivers
      const driverIdMap = new Map();
      
      // Process today's attendance records first
      todayPunchedInAttendances.forEach(attendance => {
        const driverId = attendance.driverId.toString();
        if (!driverIdMap.has(driverId)) {
          driverIdMap.set(driverId, attendance);
        }
      });
      
      // Then add previous days' records if driver not already included
      previousDaysPunchedInAttendances.forEach(attendance => {
        const driverId = attendance.driverId.toString();
        if (!driverIdMap.has(driverId)) {
          driverIdMap.set(driverId, attendance);
        }
      });
      
      // Convert map values to array of attendance records
      const punchedInAttendances = Array.from(driverIdMap.values());
      
      // Get driver IDs who are currently punched in
      const punchedInDriverIds = punchedInAttendances.map(a => a.driverId);
      
      // Find all active trips with driver assignments
      const activeTrips = await TripSchedule.find({
        status: 'in progress',
        isActive: true,
        deletedAt: null,
        driverId: { $ne: null }
      }, { driverId: 1 }).lean();
      
      // Get the driver IDs who are currently assigned to active trips
      const driversWithActiveTrips = new Set(
        activeTrips.map(trip => trip.driverId.toString())
      );
      
      // Filter out drivers who are on active trips
      const idleDriverAttendances = punchedInAttendances.filter(
        attendance => !driversWithActiveTrips.has(attendance.driverId.toString())
      );
      
      // If no idle drivers found, return empty result
      if (idleDriverAttendances.length === 0) {
        return {
          idleDriversCount: 0,
          totalPunchedInCount: punchedInAttendances.length,
          idleDrivers: []
        };
      }
      
      // Get driver details for idle drivers
      const idleDriverIds = idleDriverAttendances.map(a => a.driverId);
      const drivers = await User.find({
        _id: { $in: idleDriverIds }
      }).select('name phone lastLocation').lean();
      
      // Create a map of driver data keyed by driver ID
      const driverMap = {};
      drivers.forEach(driver => {
        driverMap[driver._id.toString()] = {
          name: driver.name,
          phone: driver.phone || null,
          lastLocation: showLocation ? (driver.lastLocation || null) : null
        };
      });
      
      // Get the last completed trip for each idle driver
      const lastCompletedTrips = await TripSchedule.find({
        driverId: { $in: idleDriverIds },
        status: 'completed',
        isActive: true,
        deletedAt: null
      }, {
        driverId: 1, 
        actualEndTime: 1
      })
      .sort({ actualEndTime: -1 })
      .lean();
      
      // Create a map of last completed trip end times by driver ID
      const lastTripEndTimeMap = {};
      lastCompletedTrips.forEach(trip => {
        const driverId = trip.driverId.toString();
        // Only store the first one for each driver (most recent)
        if (!lastTripEndTimeMap[driverId] && trip.actualEndTime) {
          lastTripEndTimeMap[driverId] = trip.actualEndTime;
        }
      });
      
      const now = new Date();
      
      // Enrich attendance records with driver information and idle time
      const idleDrivers = idleDriverAttendances.map(attendance => {
        const driverId = attendance.driverId.toString();
        
        // Get the last punch (the one without an outTime)
        const lastPunch = attendance.punches?.length > 0 
          ? attendance.punches.find(p => !p.outTime) || attendance.punches[attendance.punches.length - 1]
          : null;
        
        const punchInTime = lastPunch?.inTime || null;
        
        // Calculate idle time
        // If there's a last trip, idle time is since that trip ended
        // Otherwise, idle time is since punch-in time
        const idleFromTime = lastTripEndTimeMap[driverId] || punchInTime;
        
        // Calculate idle time in hours if we have a valid idle from time
        let idleHours = 0;
        if (idleFromTime) {
          idleHours = (now - new Date(idleFromTime)) / (1000 * 60 * 60);
        }
        
        return {
          driverId,
          ...driverMap[driverId],
          punchInTime: punchInTime,
          idleFrom: idleFromTime,
          idleHours: parseFloat(idleHours.toFixed(2)),
          idleTimeInMinutes: Math.floor(idleHours * 60)
        };
      });
      
      // Sort drivers by idle time (longest idle time first)
      idleDrivers.sort((a, b) => b.idleHours - a.idleHours);
      
      return {
        idleDriversCount: idleDrivers.length,
        totalPunchedInCount: punchedInAttendances.length,
        idleDrivers
      };
    } catch (error) {
      console.error('Get idle drivers error:', error);
      throw error;
    }
  }
}

module.exports = new DriverAttendanceService(); 