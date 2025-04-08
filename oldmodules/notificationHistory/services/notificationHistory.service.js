const { ObjectId } = require('mongodb');
const mongodbService = require('../../../common/services/mongodb.service');

class NotificationHistoryService {
  constructor() {
    this.collection = 'notificationHistories';
  }

  async createNotification(userId, title, body, data = {}) {
    const notification = {
      userId: new ObjectId(userId),
      title,
      body,
      data,
      isRead: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return mongodbService.insertOne(this.collection, notification);
  }

  async getNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, totalCount] = await Promise.all([
      mongodbService.find(
        this.collection,
        {
          userId: new ObjectId(userId),
          isActive: true
        },
        {
          sort: { createdAt: -1 },
          skip,
          limit
        }
      ),
      mongodbService.count(this.collection, {
        userId: new ObjectId(userId),
        isActive: true
      })
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getUnreadCount(userId) {
    return mongodbService.count(this.collection, {
      userId: new ObjectId(userId),
      isRead: false,
      isActive: true
    });
  }

  async markAsRead(userId, notificationIds) {
    const objectIds = notificationIds.map(id => new ObjectId(id));

    return mongodbService.updateMany(
      this.collection,
      {
        _id: { $in: objectIds },
        userId: new ObjectId(userId),
        isActive: true
      },
      {
        $set: {
          isRead: true,
          updatedAt: new Date()
        }
      }
    );
  }

  async markAllAsRead(userId) {
    return mongodbService.updateMany(
      this.collection,
      {
        userId: new ObjectId(userId),
        isRead: false,
        isActive: true
      },
      {
        $set: {
          isRead: true,
          updatedAt: new Date()
        }
      }
    );
  }
}

module.exports = new NotificationHistoryService(); 