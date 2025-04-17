/**
 * Driver Attendance Service
 * Manages driver attendance, punch in/out, and attendance history
 */
const { ObjectId } = require('mongoose').Types;
const User = require('../models/user.model');
const DriverAttendance = require('../models/driverAttendance.model');
const notificationService = require('../common/services/notification.service');
const { sendNotificationsToRoles, formatDriverPunchInNotification, formatDriverPunchOutNotification } = require('../utils/notifcationHelper');

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

      const attendance = await DriverAttendance.findOne({
        driverId: userId,
        date: today,
        isActive: true
      });

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
   * @returns {Object} Updated attendance record
   */
  async punchIn(driverId) {
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

    // Add new punch-in
    const newPunch = {
      inTime: new Date(),
      outTime: null
    };

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

    // Notify all schedulers-admins-super-admins
    sendNotificationsToRoles(['scheduler', 'admin', 'super-admin'], ['receiveDriverPunchIn'], `Driver Punch IN`, formatDriverPunchInNotification(driver.name), {
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
   * @returns {Object} Updated attendance record
   */
  async punchOut(driverId) {
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

    // Get today's attendance record
    const attendance = await DriverAttendance.findOne({
      driverId: driverId,
      date: today,
      status: 'punched-in',
      isActive: true
    });

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

    // Update the last punch with out time and duration
    attendance.punches[lastPunchIndex].outTime = outTime;
    attendance.punches[lastPunchIndex].duration = duration;

    // Calculate total hours for the day
    const totalHours = attendance.punches.reduce((total, punch) => {
      return total + (punch.duration || 0);
    }, 0);

    // Update attendance
    attendance.status = 'punched-out';
    attendance.totalHours = totalHours;
    attendance.updatedAt = new Date();
    await attendance.save();

    // Notify all schedulers-admins-super-admins
    sendNotificationsToRoles(['scheduler', 'admin', 'super-admin'], ['receiveDriverPunchOut'], `Driver Punch OUT`, await formatDriverPunchOutNotification(attendance, driverId, driver.name), {
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
  async getPunchedInDriversCount() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all attendance records for today with punched-in status
      const punchedInAttendances = await DriverAttendance.find({
        date: today,
        status: 'punched-in',
        isActive: true
      }).lean();
      
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
      }).select('name phone').lean();
      
      // Create a map of driver data keyed by driver ID
      const driverMap = {};
      drivers.forEach(driver => {
        driverMap[driver._id.toString()] = {
          name: driver.name,
          phone: driver.phone || null
        };
      });
      
      // Enrich attendance records with driver information
      const punchedInDrivers = punchedInAttendances.map(attendance => {
        const driverId = attendance.driverId.toString();
        return {
          driverId,
          ...driverMap[driverId],
          punchInTime: attendance.punches && attendance.punches.length > 0 
            ? attendance.punches[attendance.punches.length - 1].inTime 
            : null
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
}

module.exports = new DriverAttendanceService(); 