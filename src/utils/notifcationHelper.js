const User = require('../models/user.model');
const NotificationService = require('../common/services/notification.service');
const { UserNotificationSettings } = require('../models');
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
  if (tripRequest.destination) {
    firstLineStingArray.push(tripRequest.destination);
  }

  notificationString += `• ${firstLineStingArray.join(' - ')}`;
  
  let secondLineStingArray = [];
  if (tripRequest.purpose) {
    secondLineStingArray.push(tripRequest.purpose.name);
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

  secondLineStingArray.push(tripSchedule.destinations && tripSchedule.destinations.length > 1?"Connecting":"Direct");
  
  notificationString += `\n• ${secondLineStingArray.join(' - ')}`;

  return notificationString;
}
module.exports = {
  sendNotificationsToRoles,
  sendNotificationsToIds,
  formatTripRequestNotification,
  formatTripScheduleNotification
}

