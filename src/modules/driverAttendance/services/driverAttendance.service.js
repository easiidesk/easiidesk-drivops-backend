/**
 * Driver Attendance Service
 * Manages driver attendance, punch in/out, and attendance history
 */
const { ObjectId } = require('mongodb');
const mongodbService = require('../../../common/services/mongodb.service');
const notificationService = require('../../../common/services/notification.service');
const notificationSettingsService = require('../../notificationSettings/services/notificationSettings.service');

class DriverAttendanceService {
  constructor() {
    this.userCollection = 'users';
    this.attendanceCollection = 'driverAttendances';
  }

  /**
   * Get current punch status for a driver
   * @param {string} userId - Driver ID
   * @returns {Object} Punch status information
   */
  async getDriverPunchStatus(userId) {
    try {
      // Verify driver exists
      const driver = await mongodbService.findOne(this.userCollection, {
        _id: new ObjectId(userId),
        role: 'driver',
        isActive: true,
        deletedAt: null
      });

      if (!driver) {
        throw new Error('Driver not found');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await mongodbService.findOne(this.attendanceCollection, {
        driverId: new ObjectId(userId),
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
    const driver = await mongodbService.findOne(this.userCollection, {
      _id: new ObjectId(driverId),
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
    let attendance = await mongodbService.findOne(this.attendanceCollection, {
      driverId: new ObjectId(driverId),
      date: today,
      isActive: true
    });

    // If no attendance record exists for today, create one
    if (!attendance) {
      attendance = {
        driverId: new ObjectId(driverId),
        date: today,
        punches: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Check if last punch was a punch-in without punch-out
    const lastPunch = attendance.punches && attendance.punches.length > 0 
      ? attendance.punches[attendance.punches.length - 1] 
      : null;

    if (lastPunch && !lastPunch.outTime) {
      throw new Error('Already punched in');
    }

    // Add new punch-in
    const newPunch = {
      inTime: new Date(),
      outTime: null
    };

    const update = attendance._id ? {
      $push: { punches: newPunch },
      $set: { 
        status: 'punched-in',
        updatedAt: new Date()
      }
    } : {
      ...attendance,
      deletedAt: null,
      punches: [newPunch],
      status: 'punched-in'
    };

    // Update or insert attendance record
    if (attendance._id) {
      await mongodbService.updateOne(
        this.attendanceCollection,
        { _id: attendance._id },
        update
      );
    } else {
      await mongodbService.insertOne(this.attendanceCollection, update);
    }

    // Update driver availability
    await mongodbService.updateOne(
      this.userCollection,
      { _id: new ObjectId(driverId) },
      { 
        $set: { 
          'driverDetails.isAvailable': true,
          updatedAt: new Date()
        }
      }
    );

    // After successful punch in, send notifications
    const notificationUsersTokens = await notificationSettingsService.getNotificationEnabledUsers(
      ['scheduler', 'admin', 'super-admin'],
      'receiveDriverPunchIn'
    );

    if (notificationUsersTokens.length > 0) {
      await notificationService.sendNotification(
        notificationUsersTokens, 
        'Driver Punch In',
        `• ${driver.name} has punched in`,
        {
          type: 'driver_punch_in',
          driverId: driverId.toString(),
          time: new Date().toISOString()
        }
      );
    }

    return { 
      ...attendance, 
      ...(attendance._id ? { punches: [...attendance.punches, newPunch] } : update) 
    };
  }

  /**
   * Punch out a driver
   * @param {string} driverId - Driver ID
   * @returns {Object} Updated attendance record
   */
  async punchOut(driverId) {
    // Verify driver exists
    const driver = await mongodbService.findOne(this.userCollection, {
      _id: new ObjectId(driverId),
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
    const attendance = await mongodbService.findOne(this.attendanceCollection, {
      driverId: new ObjectId(driverId),
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
    attendance.punches[lastPunchIndex] = {
      ...lastPunch,
      outTime,
      duration
    };

    // Calculate total hours for the day
    const totalHours = attendance.punches.reduce((total, punch) => {
      return total + (punch.duration || 0);
    }, 0);

    const update = {
      punches: attendance.punches,
      status: 'punched-out',
      totalHours,
      updatedAt: new Date()
    };

    await Promise.all([
      mongodbService.updateOne(
        this.attendanceCollection,
        { _id: attendance._id },
        { $set: update }
      ),
      mongodbService.updateOne(
        this.userCollection,
        { _id: new ObjectId(driverId) },
        { 
          $set: { 
            'driverDetails.isAvailable': false,
            updatedAt: new Date()
          }
        }
      )
    ]);

    // After successful punch out, prepare notification data
    const notificationUsersWithTokens = await notificationSettingsService.getNotificationEnabledUsers(
      ['scheduler', 'admin', 'super-admin'],
      'receiveDriverPunchOut'
    );

    if (notificationUsersWithTokens.length > 0) {
      // Get all attendance records that might be relevant
      const lastPunchInDate = attendance.punches[attendance.punches.length - 1].inTime;
      const startOfLastPunchInDay = new Date(lastPunchInDate);
      startOfLastPunchInDay.setHours(0, 0, 0, 0);

      // Calculate total time for the period
      let totalTimeInMinutes = 0;
      const attendanceRecords = await mongodbService.find(
        this.attendanceCollection,
        {
          driverId: new ObjectId(driverId),
          date: { $gte: startOfLastPunchInDay },
          isActive: true
        }
      );

      // Calculate total time across all relevant days
      for (const record of attendanceRecords) {
        for (const punch of record.punches) {
          if (punch.inTime && punch.outTime) {
            const punchDuration = (punch.outTime - punch.inTime) / (1000 * 60); // Convert to minutes
            totalTimeInMinutes += punchDuration;
          }
        }
      }

      // Format the time
      const hours = Math.floor(totalTimeInMinutes / 60);
      const minutes = Math.floor(totalTimeInMinutes % 60);
      const timeString = `${hours}h ${minutes}m`;

      // Format the last punch in date
      const formattedLastPunchIn = lastPunchInDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });

      await notificationService.sendNotification(
        notificationUsersWithTokens, 
        'Driver Punch Out',
        `• ${driver.name} has punched out.\n• Total time: ${timeString}`,
        {
          type: 'driver_punch_out',
          driverId: driverId.toString(),
          driverName: driver.name,
          lastPunchIn: formattedLastPunchIn,
          totalTime: timeString,
          time: new Date().toISOString()
        }
      );
    }

    return { ...attendance, ...update };
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
      filter.driverId = new ObjectId(driverId);
    }

    const [attendances, totalCount] = await Promise.all([
      mongodbService.find(
        this.attendanceCollection,
        filter,
        { skip, limit, sort: { date: -1 } }
      ),
      mongodbService.count(this.attendanceCollection, filter)
    ]);

    // Get driver details for each attendance record
    const driverIds = attendances.map(a => a.driverId);
    const drivers = await mongodbService.find(
      this.userCollection,
      { _id: { $in: driverIds } }
    );

    const driversMap = drivers.reduce((map, driver) => {
      map[driver._id.toString()] = {
        name: driver.name,
        phone: driver.phone,
        email: driver.email
      };
      return map;
    }, {});

    const enrichedAttendances = attendances.map(attendance => ({
      ...attendance,
      driver: driversMap[attendance.driverId.toString()] || null
    }));

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
      driverId: new ObjectId(driverId),
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
      mongodbService.find(
        this.attendanceCollection,
        filter,
        { skip, limit, sort: { date: -1 } }
      ),
      mongodbService.count(this.attendanceCollection, filter)
    ]);

    // Calculate total hours across all days in the result
    const totalHours = attendances.reduce((total, attendance) => {
      return total + (attendance.totalHours || 0);
    }, 0);

    return {
      data: attendances,
      summary: {
        totalHours,
        totalDays: attendances.length,
        averageHoursPerDay: attendances.length > 0 ? totalHours / attendances.length : 0
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