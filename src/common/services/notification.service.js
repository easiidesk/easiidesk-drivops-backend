const admin = require('firebase-admin');
const mongodbService = require('./mongodb.service');
const notificationHistoryService = require('../../services/notificationHistory.service');
const config = require('../../config/env');

class NotificationService {
  constructor() {
    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.FIREBASE_PROJECT_ID,
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
        privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    });
  }

  async sendNotification(tokens, title, body, data = {}) {
    try {
      if (!tokens || tokens.length === 0) return;

      // Create message object for each token
      const messages = tokens.map(token => ({
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        token: token
      }));

      // Split messages into batches of 500 (FCM limit)
      const batchSize = 500;
      const messageBatches = [];
      for (let i = 0; i < messages.length; i += batchSize) {
        messageBatches.push(messages.slice(i, i + batchSize));
      }

      // Send notifications in batches
      let successCount = 0;
      let failedTokens = [];

      await Promise.all(messageBatches.map(async (batch) => {
        try {
          const response = await admin.messaging().sendEachForMulticast({
            tokens: batch.map(msg => msg.token),
            notification: {
              title,
              body,
            },
            data: {
              ...data,
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            }
          });

          successCount += response.successCount;

          // Collect failed tokens
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(batch[idx].token);
            }
          });
        } catch (error) {
          console.error('Batch send error:', error);
          // Add all tokens from failed batch to failedTokens
          failedTokens.push(...batch.map(msg => msg.token));
        }
      }));

      

      // Non-blocking notification history creation
      this.storeNotificationHistory(tokens, title, body, data).catch(error => {
        console.error('Store notification history error:', error);
      });

      return {
        successCount,
        failureCount: failedTokens.length,
        totalAttempted: tokens.length
      };
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  }

  async removeInvalidTokens(tokens) {
    try {
      await mongodbService.updateMany(
        'users',
        { fcmTokens: { $in: tokens } },
        { $pull: { fcmTokens: { $in: tokens } } }
      );
    } catch (error) {
      console.error('Remove invalid tokens error:', error);
    }
  }

  async notifyAdmins(title, body, data = {}) {
    try {
      const adminUsers = await mongodbService.find('users', {
        role: { $in: ['scheduler', 'admin', 'super-admin'] },
        fcmTokens: { $exists: true, $ne: [] }
      });

      const tokens = adminUsers.flatMap(user => user.fcmTokens || []);
      if (tokens.length > 0) {
        await this.sendNotification(tokens, title, body, data);
      }
    } catch (error) {
      console.error('Notify admins error:', error);
    }
  }

  async notifyTripRequestUsers(tripRequestIds, title, body, data = {}) {
    try {
      const requests = await mongodbService.find('tripRequests', {
        _id: { $in: tripRequestIds.map(id => new ObjectId(id)) }
      });

      const userIds = [...new Set(requests.map(req => req.createdBy.toString()))];
      
      const users = await mongodbService.find('users', {
        _id: { $in: userIds },
        fcmTokens: { $exists: true, $ne: [] }
      });

      const tokens = users.flatMap(user => user.fcmTokens || []);
      if (tokens.length > 0) {
        await this.sendNotification(tokens, title, body, data);
      }
    } catch (error) {
      console.error('Notify trip request users error:', error);
    }
  }

  async sendNotificationByPhone(phone, title, body, data = {}) {
    try {
      // Find user by phone number
      const user = await mongodbService.findOne('users', { 
        phone,
        isActive: true,
        deletedAt: null
      });

      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        throw new Error('No FCM tokens found for this phone number');
      }

      // Send notification to all user's tokens
      await this.sendNotification(user.fcmTokens, title, body, data);

      return true;
    } catch (error) {
      console.error('Send notification by phone error:', error);
      throw error;
    }
  }

  async storeNotificationHistory(tokens, title, body, data) {
    try {
      // Get users who have these tokens
      const users = await mongodbService.find('users', {
        fcmTokens: { $in: tokens },
        isActive: true,
        deletedAt: null
      });

      // Create notifications in parallel for all users
      const createPromises = users.map(user => 
        notificationHistoryService.createNotification({
          userId: user._id,
          title,
          body,
          data: {
            ...data,
            userId: user._id.toString()
          }
        }
        )
      );

      await Promise.all(createPromises);
    } catch (error) {
      console.error('Store notification history error:', error);
    }
  }
}

module.exports = new NotificationService(); 