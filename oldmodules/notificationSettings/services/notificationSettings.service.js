const { ObjectId } = require('mongodb');
const mongodbService = require('../../../common/services/mongodb.service');
const userService = require('../../users/services/user.service');
const {
  adminNotificationSchema,
  requestorNotificationSchema,
  driverNotificationSchema
} = require('../../../models/userNotificationSettings.model');

class NotificationSettingsService {
  constructor() {
    this.collection = 'userNotificationSettings';
  }

  getDefaultSettings(role) {
    switch(role) {
      case 'admin':
      case 'super-admin':
      case 'scheduler':
        return { ...adminNotificationSchema };
      case 'requestor':
        return { ...requestorNotificationSchema };
      case 'driver':
        return { ...driverNotificationSchema };
      default:
        throw new Error('Invalid role');
    }
  }

  async createSettings(userId) {
    // Get user's role from users collection
    const user = await mongodbService.findOne('users', {
      _id: new ObjectId(userId),
      isActive: true,
      deletedAt: null
    });

    if (!user) {
      throw new Error('User not found');
    }

    const settings = {
      userId: new ObjectId(userId),
      settings: this.getDefaultSettings(user.role),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return mongodbService.insertOne(this.collection, settings);
  }

  async updateSettings(userId, role) {
    const existingSettings = await mongodbService.findOne(this.collection, {
      userId: new ObjectId(userId),
      isActive: true
    });

    if (!existingSettings) {
      // If no settings exist, create new
      return this.createSettings(userId);
    }

    // Update existing settings with new role's default settings
    const newSettings = this.getDefaultSettings(role);
    
    return mongodbService.updateOne(
      this.collection,
      { userId: new ObjectId(userId) },
      {
        $set: {
          role,
          settings: newSettings,
          updatedAt: new Date()
        }
      }
    );
  }

  async deleteSettings(userId) {
    return mongodbService.updateOne(
      this.collection,
      { userId: new ObjectId(userId) },
      {
        $set: {
          isActive: false,
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
  }

  async getSettings(userId) {
    return mongodbService.findOne(this.collection, {
      userId: new ObjectId(userId),
      isActive: true
    });
  }

  async getNotificationEnabledUsers(roles, notificationType, notInUserIds = []) {
    try {
      // First get users with specified roles
      const users = await mongodbService.find('users', {
        role: { $in: roles },
        _id: { $nin: notInUserIds },
        isActive: true,
        deletedAt: null
      });

      const userIds = users.map(user => user._id);

      // Then get notification settings for these users
      const notificationSettings = await mongodbService.find(this.collection, {
        userId: { $in: userIds },
        'settings.receiveNotification': true,
        [`settings.${notificationType}`]: true,
        isActive: true,
        deletedAt: null
      });

      // Get the user IDs that have notifications enabled
      const enabledUserIds = notificationSettings.map(setting => setting.userId);

      // Filter users who have notifications enabled
      const enabledUsers = users.filter(user => 
        enabledUserIds.some(id => id.toString() === user._id.toString())
      );

      // Get all FCM tokens
      const tokens = enabledUsers.flatMap(user => user.fcmTokens || []);

      return tokens;
    } catch (error) {
      console.error('Get notification enabled users error:', error);
      return [];
    }
  }

  async getNotificationEnabledUsersByIds(userIds, notificationType) {
    try {
      // Convert string IDs to ObjectId
      const objectIds = userIds.map(id => new ObjectId(id));

      const notificationQuery = {
        userId: { $in: objectIds },
        'settings.receiveNotification': true,
        [`settings.${notificationType}`]: true,
        isActive: true,
        deletedAt: null
      }
      console.log(notificationQuery);

      // Get users and their notification settings in parallel
      const [users, notificationSettings] = await Promise.all([
        mongodbService.find('users', {
          _id: { $in: objectIds },
          isActive: true,
          deletedAt: null
        }),
        mongodbService.find(this.collection, notificationQuery)
      ]);

      // Get the user IDs that have notifications enabled
      const enabledUserIds = notificationSettings.map(setting => setting.userId.toString());

      // Create a map of userId to tokens for enabled users
      const userTokensMap = users
        .filter(user => enabledUserIds.includes(user._id.toString()))
        .reduce((map, user) => {
          map[user._id.toString()] = user.fcmTokens || [];
          return map;
        }, {});

      return userTokensMap;
    } catch (error) {
      console.error('Get notification enabled users by IDs error:', error);
      return {};
    }
  }

  async updateUserSettings(userId, newSettings) {
    const existingSettings = await mongodbService.findOne(this.collection, {
      userId: new ObjectId(userId),
      isActive: true
    });

    if (!existingSettings) {
      throw new Error('Notification settings not found');
    }

    // Get user's role from users collection
    const user = await mongodbService.findOne('users', {
      _id: new ObjectId(userId),
      isActive: true,
      deletedAt: null
    });

    // For drivers, ensure immutable settings aren't changed
    if (user.role === 'driver') {
      const updatedSettings = {
        ...existingSettings.settings,
        ...newSettings
      };
      
      // Restore immutable settings to their original values
      updatedSettings.receiveTripScheduledNotfications = 
        existingSettings.settings.receiveTripScheduledNotfications;
      updatedSettings.receiveTripScheduleUpdatedNotification = 
        existingSettings.settings.receiveTripScheduleUpdatedNotification;

      const result = await mongodbService.updateOne(
        this.collection,
        { userId: new ObjectId(userId) },
        {
          $set: {
            settings: updatedSettings,
            updatedAt: new Date()
          }
        }
      );

      return {
        ...existingSettings,
        settings: updatedSettings,
        updatedAt: new Date()
      };
    }

    // For other roles, simply update the settings
    const updatedSettings = {
      ...existingSettings.settings,
      ...newSettings
    };

    const result = await mongodbService.updateOne(
      this.collection,
      { userId: new ObjectId(userId) },
      {
        $set: {
          settings: updatedSettings,
          updatedAt: new Date()
        }
      }
    );

    return {
      ...existingSettings,
      settings: updatedSettings,
      updatedAt: new Date()
    };
  }

  async resetSuperAdminSettings(userId) {
    const existingSuperAdminIds = await userService.getSuperAdminIds();

    if (!existingSuperAdminIds || existingSuperAdminIds.length === 0) {
        return true;
    }
    else {

    // Get default admin notification settings
    const defaultSettings = this.getDefaultSettings('super-admin');
    const existingObjectIds = existingSuperAdminIds.map(id => new ObjectId(id));

    // Update the settings
    await mongodbService.updateMany(
      this.collection,
      { userId: { $in: existingObjectIds } },
      {
        $set: {
          settings: defaultSettings,
          updatedAt: new Date(),
          isActive: true
        }
      },
      {
        upsert: true
      }
    );

    return true;
}
  }
}

module.exports = new NotificationSettingsService(); 