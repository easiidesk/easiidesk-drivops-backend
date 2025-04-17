const User = require('../models/user.model');
const NotificationService = require('../common/services/notification.service');
const { UserNotificationSettings } = require('../models');
const {DriverAttendance} = require('../models');
const sendNotificationsToRoles = async (roles, notificationTypeList, title, message, data) => {
  let tokensToSendNotification = [];
  const users = await User.find({ role: { $in: roles } });
  const userMap = {};
  users.forEach(user => {
    userMap[user._id] = user;
  });
  const userNotificationSettings = await UserNotificationSettings.find({ userId: { $in: users.map(user => user._id) }});
  userNotificationSettings.forEach(userNotificationSetting => {
    notificationTypeList.forEach(notificationType => {
      if (userNotificationSetting.settings['receiveNotification'] && userNotificationSetting.settings[notificationType]) {
        tokensToSendNotification.push(...userMap[userNotificationSetting.userId].fcmTokens);
      }
    });
  });

  await NotificationService.sendNotification(tokensToSendNotification, title, message, data);
}

const sendNotificationsToIds = async (ids, notificationTypeList, title, message, data) => {
  try {
    let tokensToSendNotification = [];
    const users = await User.find({ _id: { $in: ids } });
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = user;
    });
    const userNotificationSettings = await UserNotificationSettings.find({ userId: { $in: users.map(user => user._id) }});
    userNotificationSettings.forEach(userNotificationSetting => {
      if (userNotificationSetting.settings['receiveNotification']) {
        if(notificationTypeList.length>0){
          notificationTypeList.forEach(notificationType => {
            if (userNotificationSetting.settings[notificationType]) {
              tokensToSendNotification.push(...userMap[userNotificationSetting.userId].fcmTokens);
            }
          });
        }else{
          tokensToSendNotification.push(...userMap[userNotificationSetting.userId].fcmTokens);
        }
      }
    });
  
    await NotificationService.sendNotification(tokensToSendNotification, title, message, data);
  } catch (error) {
    console.error('Send notification error:', error);
    throw error;
  }
}

const formatTripRequestNotification = (tripRequest) => {
  let notificationString = '';

  let firstLineStingArray = [];
  if (tripRequest.dateTime) {
    firstLineStingArray.push(new Date(tripRequest.dateTime).toLocaleString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }));
  }
  if (tripRequest.destinations) {
    firstLineStingArray.push(tripRequest.destinations.map(dest => dest.destination).join(', '));
  }

  notificationString += `• ${firstLineStingArray.join(' - ')}`;
  
  let secondLineStingArray = [];
  if (tripRequest.destinations) {
    secondLineStingArray.push(tripRequest.destinations.map(dest => dest.purpose.name).join(', '));
  }
  if (tripRequest.createdBy) {
    secondLineStingArray.push(tripRequest.createdBy.name);
  }

  notificationString += `\n• ${secondLineStingArray.join(' - ')}`;
  
  return notificationString;
}

const formatTripScheduleNotification = (tripSchedule) => {
  let notificationString = '';
  let firstLineStingArray = [];
  if (tripSchedule.tripStartTime) {
    firstLineStingArray.push(new Date(tripSchedule.tripStartTime).toLocaleString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }));
  }
  if (tripSchedule.vehicle) {
    firstLineStingArray.push(tripSchedule.vehicle.name);
  }

  notificationString += `• ${firstLineStingArray.join(' - ')}`;

  let secondLineStingArray = [];
  if (tripSchedule.driver) {
    secondLineStingArray.push(tripSchedule.driver.name);
  }

  // Check if there are multiple destinations
  const destinationCount = tripSchedule.destinations ? tripSchedule.destinations.length : 0;
  secondLineStingArray.push(destinationCount > 1 ? "Connecting" : "Direct");
  
  notificationString += `\n• ${secondLineStingArray.join(' - ')}`;

    notificationString += '\n• Destinations:';
    tripSchedule.destinations.forEach((dest, index) => {
      // Handle different ways destination could be stored in the structure
      let destinationInfo;
      destinationInfo = dest.destinations && dest.destinations.map((e)=>e.destination).join(', ');
      
      notificationString += `\n  ${index + 1}. ${destinationInfo}`;
    });
  

  return notificationString;
}

const formatDriverPunchInNotification = (driverName) => {
  return `• ${driverName} has punched in`;
}

const formatDriverPunchOutNotification = async (attendance,driverId,driverName) => {
    // Get all attendance records that might be relevant
    const lastPunchInDate = attendance.punches[attendance.punches.length - 1].inTime;
    const startOfLastPunchInDay = new Date(lastPunchInDate);
    startOfLastPunchInDay.setHours(0, 0, 0, 0);

    // Calculate total time for the period
    let totalTimeInMinutes = 0;
    const attendanceRecords = await DriverAttendance.find( {
        driverId,
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


  return `• ${driverName} has punched out.\n• Total time: ${timeString}`;
}

module.exports = {
  sendNotificationsToRoles,
  sendNotificationsToIds,
  formatTripRequestNotification,
  formatTripScheduleNotification,
  formatDriverPunchInNotification,
  formatDriverPunchOutNotification
}

