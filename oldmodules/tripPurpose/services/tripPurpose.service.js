const { ObjectId } = require('mongodb');
const mongodbService = require('../../../common/services/mongodb.service');

class TripPurposeService {
  constructor() {
    this.collection = 'tripPurposes';
  }

  async getTripPurposes() {
    return mongodbService.find(this.collection, { isActive: true, deletedAt: null });
  }

  async getTripPurposeById(id) {
    return mongodbService.findOne(this.collection, {
      _id: new ObjectId(id),
      isActive: true
    });
  }

  async getTripPurposeMapBasic() {
    const purposes = await mongodbService.find(this.collection, {
      isActive: true,
      deletedAt: null
    });
    return new Map(purposes.map(purpose => [purpose._id.toString(), purpose]));
  }

  async getTripPurposeByIds(ids) {
    return mongodbService.find(this.collection, {
      _id: { $in: ids.map(id => new ObjectId(id)) },
      isActive: true,
      deletedAt: null
    });
  }

  async createTripPurpose(data) {
    const tripPurpose = {
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null
    };

    return await mongodbService.insertOne(this.collection, tripPurpose);
  }

  async updateTripPurpose(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    return mongodbService.updateOne(
      this.collection,
      { _id: new ObjectId(id), isActive: true },
      { $set: updateData }
    );
  }

  async deleteTripPurpose(id, userId) {
    return await mongodbService.updateOne(
      this.collection,
      { _id: new ObjectId(id), isActive: true },
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
}

module.exports = new TripPurposeService(); 