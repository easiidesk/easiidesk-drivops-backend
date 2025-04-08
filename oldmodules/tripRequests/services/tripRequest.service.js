const { ObjectId } = require('mongodb');
const mongodbService = require('../../../common/services/mongodb.service');
const vehicleService = require('../../vehicles/services/vehicle.service');
const tripPurposeService = require('../../tripPurpose/services/tripPurpose.service');
const userService = require('../../users/services/user.service');
const driverService = require('../../drivers/services/driver.service');
const tripScheduleService = require('../../tripSchedule/services/tripSchedule.service');
const notificationService = require('../../../common/services/notification.service');

class TripRequestService {
  constructor() {
    this.collection = 'tripRequests';
  }

  async getTripRequestBasic(ids = []) {
    const query = { deletedAt: null, _id: { $in: ids.map(id => new ObjectId(id)) } };
    const result = await mongodbService.find(this.collection, query, {
      sort: { createdAt: -1 }
    })

    return result;
    
  }

  async getTripRequests(filters = {}, pagination = { page: 1, limit: 10 }) {
    try {
      // Build query filters
      const query = { deletedAt: null };

      // Add status filter
      if (filters.status) {
        query.status = { $in: filters.status };
      }

      // Add createdBy filter
      if (filters.createdBy) {
        query.createdBy = filters.createdBy;
      }

      // Add date range filter
      if (filters.dateFrom || filters.dateTo) {
        query.dateTime = {};
        if (filters.dateFrom) {
          query.dateTime.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.dateTime.$lte = new Date(filters.dateTo);
        }
      }


      // Add vehicle filter
      if (filters.vehicleId) {
        query.requiredVehicle = { $in: filters.vehicleId };
      }

      // Calculate skip value for pagination
      const skip = (pagination.page - 1) * pagination.limit;

      // Get total count and trip requests in parallel
      const { db } = await mongodbService.connect();
      const [totalCount, tripRequests] = await Promise.all([
        db.collection(this.collection).countDocuments(query),
        mongodbService.find(
          this.collection,
          query,
          {
            skip,
            limit: parseInt(pagination.limit),
            sort: { createdAt: -1 }
          }
        )
      ]);

      if (tripRequests.length === 0) {
        return {
          data: [],
          pagination: {
            total: 0,
            page: parseInt(pagination.page),
            limit: parseInt(pagination.limit),
            totalPages: 0
          }
        };
      }

      const linkedTripIds = [...new Set(tripRequests
        .filter(req => req.linkedTripId)
        .map(req => req.linkedTripId))];

      // Fetch all related data in parallel
      const [
        linkedTrips,
        purposes,
        vehicles,
        users
      ] = await Promise.all([
        linkedTripIds.length > 0 ? tripScheduleService.getSchedulesBasic({
          _id: { $in: linkedTripIds.map(id => new ObjectId(id)) },
          isActive: true,
          deletedAt: null
        }) : [],
        tripPurposeService.getTripPurposes(),
        vehicleService.getVehicles(),
        userService.getUsers()
      ]);

      // Create maps for lookups
      const tripScheduleMap = new Map(linkedTrips.map(trip => [trip._id.toString(), trip]));
      const tripPurposeMap = new Map(purposes.map(purpose => [purpose._id.toString(), purpose]));
      const vehicleMap = new Map(vehicles.map(vehicle => [vehicle._id.toString(), vehicle]));
      const userMap = new Map(users.map(user => [user._id.toString(), user]));

      

      // Extract request IDs from all linked trips
      const requestIds = linkedTrips
        .reduce((acc, trip) => {
          if (trip.destinations && Array.isArray(trip.destinations)) {
            acc.push(...trip.destinations.map(destination =>  destination.requestId).filter(Boolean));
          }
          return acc;
        }, []);

      // Get unique request IDs
      const uniqueRequestIds = [...new Set(requestIds)];

      // Get all requests for the linked trips
      const linkedRequests = uniqueRequestIds.length > 0 ? 
        await this.getTripRequestBasic(uniqueRequestIds) : [];

      const linkedRequestsMap = new Map(linkedRequests.map(request => [request._id.toString(), request]));

      // Get drivers for linked trips if any exist
      const driverIds = linkedTrips
        .filter(trip => trip.driverId)
        .map(trip => new ObjectId(trip.driverId));

      const drivers = driverIds.length > 0 ? 
        await driverService.getDrivers({
          _id: { $in: driverIds },
          isActive: true,
          deletedAt: null
        }) : [];

      const tripDriverMap = new Map(drivers.map(driver => [driver._id.toString(), driver]));

      // Enhance trip requests with purpose, vehicle, and user details
      const enhancedRequests = tripRequests.map((request) => {
        // Get purpose details
        const purpose = tripPurposeMap.get(request.purpose);
        const vehicles = request.requiredVehicle.map((vehicleId) => {
          const vehicle = vehicleMap.get(vehicleId);
          return vehicle ? {
            id: vehicleId,
            name: vehicle.name,
            plateNumber: vehicle.plateNumber
          } : null;
        });

        // Get user details who created the request
        const createdByUser = userMap.get(request.createdBy);
        const userDetails = createdByUser ? {
          id: createdByUser._id,
          name: createdByUser.name,
          phone: createdByUser.phone,
        } : null;

        const linkedTrip = tripScheduleMap.get(request.linkedTripId);

        return {
          ...request,
          purpose: purpose ? {
            id: purpose._id,
            name: purpose.name,
            jobCardNeeded: purpose.jobCardNeeded
          } : null,
          requiredVehicle: vehicles.filter(v => v !== null),
          createdBy: userDetails, // Replace createdBy ID with user details
          tripSchedule: linkedTrip ? {
            id: linkedTrip._id,
            tripStartTime: linkedTrip.tripStartTime,
            tripApproxReturnTime: linkedTrip.tripApproxReturnTime,
            driver: (linkedTrip.driverId ? tripDriverMap.get(linkedTrip.driverId) : null),
            vehicle: (linkedTrip.vehicleId ? vehicleMap.get(linkedTrip.vehicleId) : null),
            destinations: linkedTrip.destinations.map(destination => ({
              ...destination,
              purpose:tripPurposeMap.get(destination.purposeId),
              destination: linkedRequestsMap.get(destination.requestId)?.destination
            }))
          } : null
        };
      });

      // Return paginated response
      return {
        data: enhancedRequests,
        pagination: {
          total: totalCount,
          page: parseInt(pagination.page),
          limit: parseInt(pagination.limit),
          totalPages: Math.ceil(totalCount / parseInt(pagination.limit))
        }
      };
    } catch (error) {
      console.error('Get trip requests error:', error);
      throw error;
    }
  }

  async getTripRequestById(id) {
    const request = await mongodbService.findOne(this.collection, {
      _id: new ObjectId(id),
      deletedAt: null
    });

    if (!request) return null;

    // Get purpose details
    const purpose = await tripPurposeService.getTripPurposeById(request.purpose);
    
    // Get vehicle details
    const vehicles = await Promise.all(request.requiredVehicle.map(async (vehicleId) => {
      const vehicle = await vehicleService.getVehicleById(vehicleId);
      return vehicle ? {
        id: vehicleId,
        name: vehicle.name,
        plateNumber: vehicle.plateNumber
      } : null;
    }));

    return {
      ...request,
      purpose: purpose ? {
        id: purpose._id,
        name: purpose.name,
        jobCardNeeded: purpose.jobCardNeeded
      } : null,
      requiredVehicle: vehicles.filter(v => v !== null)
    };
  }

  async getTripRequestsByIdsBasic(ids) {
    const requests = await mongodbService.find(this.collection, {
      _id: { $in: ids.map(id => new ObjectId(id)) },
      deletedAt: null
    });
    return requests;
  }

  async validateTripRequest(data) {
    let validatedData = {
      vehicles: [],
      purpose: null
    };
    // Validate if vehicles exist
    for (const vehicleId of data.requiredVehicle) {
      const vehicle = await vehicleService.getVehicleById(vehicleId);
      if (!vehicle) {
        throw new Error(`Vehicle with ID ${vehicleId} not found`);
      }
      validatedData.vehicles.push(vehicle);
    }

    if (data.purpose) {
      // Validate if purpose exists and check jobCard requirement
      const purpose = await tripPurposeService.getTripPurposeById(data.purpose);
      if (!purpose) {
        throw new Error(`Trip purpose with ID ${data.purpose} not found`);
      }
      validatedData.purpose = purpose;

    // If purpose requires job card but no jobCardId provided
      if (purpose.jobCardNeeded && !data.jobCardId) {
        throw new Error('Job card ID is required for this trip purpose');
      }
    }

    return validatedData;
  }

  async createTripRequest(data, user) {
    const userId = user.userId;
    const validatedData = await this.validateTripRequest(data);

    const tripRequest = {
      ...data,
      createdBy: userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      deletedAt: null,
      deletedBy: null
    };

    const result = await mongodbService.insertOne(this.collection, tripRequest);

    // Notify admins about new trip request
    await notificationService.notifyAdmins(
      'New Trip Request',
      `• ${new Date(data.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${new Date(data.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${data.destination}\n• ${validatedData.purpose.name} - ${user.name}`,
      {
        type: 'trip_request',
        id: result.insertedId.toString()
      }
    );

    return result;
  }

  async updateTripRequest(id, updateData, needStatusCheck = true) {
    const request = await this.getTripRequestById(id);
    if (!request) {
      throw new Error('Trip request not found');
    }
    else if (request.status == 'scheduled' && needStatusCheck) {
      throw new Error('Trip request is already scheduled');
    }
    if (updateData.requiredVehicle || updateData.purpose) {
      if (updateData.requiredVehicle && updateData.requiredVehicle.length > 0 && updateData.purpose) {
        await this.validateTripRequest({
          requiredVehicle: updateData.requiredVehicle,
          purpose: updateData.purpose,
          jobCardId: updateData.jobCardId
        });
      } else if (updateData.requiredVehicle && updateData.requiredVehicle.length > 0) {
        await this.validateTripRequest({
          requiredVehicle: updateData.requiredVehicle,
        });
      } else if (updateData.purpose) {
        await this.validateTripRequest({
          purpose: updateData.purpose,  
        });
      }
    }

    const result = await mongodbService.updateOne(this.collection, { _id: new ObjectId(id), deletedAt: null },
      {
        $set: {
          ...updateData,
          modifiedAt: new Date().toISOString()
        }
      }
    );
    return result;
  }

  async deleteTripRequest(id, userId) {
    const result = await mongodbService.updateOne(
      this.collection,
      { _id: new ObjectId(id), deletedAt: null },
      {
        $set: {
          deletedAt: new Date().toISOString(),
          deletedBy: userId,
          modifiedAt: new Date().toISOString()
        }
      }
    );
    return result;
  }
}

module.exports = new TripRequestService(); 