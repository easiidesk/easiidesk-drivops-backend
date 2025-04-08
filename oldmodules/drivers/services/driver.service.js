const { ObjectId } = require('mongodb');
const mongodbService = require('../../../common/services/mongodb.service');

class DriverService {
  constructor() {
    this.collection = 'users';
  }

  async getDrivers(query = {}) {
    try {
      // Add default filters for active and non-deleted records
      const filter = {
        isActive: true,
        deletedAt: null,
        role: 'driver',
        ...query
      };

      return await mongodbService.find(this.collection, filter);
    } catch (error) {
      console.error('Get drivers error:', error);
      throw error;
    }
  }

  async getDriverById(id) {
    try {
      return await mongodbService.findOne(this.collection, {
        _id: new ObjectId(id),
        role: 'driver',
        isActive: true,
        deletedAt: null
      });
    } catch (error) {
      console.error('Get driver by ID error:', error);
      throw error;
    }
  }
}

module.exports = new DriverService(); 