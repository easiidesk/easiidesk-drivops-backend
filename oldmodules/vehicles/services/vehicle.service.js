const { ObjectId } = require('mongodb');
const mongodbService = require('../../../common/services/mongodb.service');

class VehicleService {
  constructor() {
    this.collection = 'vehicles';
  }

  async getVehicles() {
    return mongodbService.find(this.collection, { isActive: true, deletedAt: null });
  }

  async getVehicleById(id) {
    return mongodbService.findOne(this.collection, {
      _id: new ObjectId(id),
      isActive: true
    });
  }

  async createVehicle(data) {
    const vehicle = {
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null
    };

    return await mongodbService.insertOne(this.collection, vehicle);
  }

  async updateVehicle(id, data) {
    const updateData = {
      ...data,
      isInMaintenance: false,
      updatedAt: new Date()
    };

    return mongodbService.updateOne(
      this.collection,
      { _id: new ObjectId(id), isActive: true },
      { $set: updateData }
    );
  }

  async deleteVehicle(id, userId) {
    return await mongodbService.updateOne(
      this.collection,
      { _id: new ObjectId(id), isActive: true, deletedAt: null },
      {
        $set: {
          isActive: false,
          deletedAt: new Date(),
          deletedBy: userId,
          updatedAt: new Date()
        }
      }
    );
  }

  async updateMaintenanceStatus(id, data) {
    return await mongodbService.updateOne(
      this.collection,
      { _id: new ObjectId(id), isActive: true, deletedAt: null},
      { $set: data }
    );
  }
}

module.exports = new VehicleService(); 