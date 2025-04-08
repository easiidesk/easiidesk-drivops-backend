const { ObjectId } = require('mongodb');
const mongodbService = require('../../../common/services/mongodb.service');
const tripRequestService = require('../../tripRequests/services/tripRequest.service');
const driverService = require('../../drivers/services/driver.service');
const vehicleService = require('../../vehicles/services/vehicle.service');
const tripPurposeService = require('../../tripPurpose/services/tripPurpose.service');
const userService = require('../../users/services/user.service');
const notificationService = require('../../../common/services/notification.service');
const notificationSettingsService = require('../../notificationSettings/services/notificationSettings.service');

class TripScheduleService {
  constructor() {
    this.collection = 'tripSchedules';
  }

  async validateSchedule(data) {
    // Check if driver exists and is active
    
    const driver = await driverService.getDriverById(data.driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    // Check if vehicle exists and is active
    const vehicle = await vehicleService.getVehicleById(data.vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Validate each trip request
    for (const destination of data.destinations) {
      if(destination.requestId) {
      const tripRequest = await tripRequestService.getTripRequestById(destination.requestId);
      if (!tripRequest) {
        throw new Error(`Trip request ${destination.requestId} not found`);
      }
      if (tripRequest.status === 'scheduled') {
        throw new Error(`Trip request ${destination.requestId} is already scheduled`);
      }
      }
    }

    // Check for scheduling conflicts
    const conflicts = await this.checkSchedulingConflicts(
      data.driverId,
      data.vehicleId,
      data.dateTime,
      data.approxReturnTime
    );
    if (conflicts) {
      throw new Error('Scheduling conflict detected');
    }
  }

  async validateScheduleUpdate(data) {
    // Check if driver exists and is active
    if(data.driverId) {
      const driver = await driverService.getDriverById(data.driverId);
      if (!driver) {
        throw new Error('Driver not found');
      }
    }

    // Check if vehicle exists and is active
    if(data.vehicleId) {
      const vehicle = await vehicleService.getVehicleById(data.vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }
    }


    // Validate each trip request
    for (const destination of data.destinations) {
      if(destination.requestId) {
        const tripRequest = await tripRequestService.getTripRequestById(destination.requestId);
        if (!tripRequest) {
          throw new Error(`Trip request ${destination.requestId} not found`);
        }
      }
    }

    // Check for scheduling conflicts
    const conflicts = await this.checkSchedulingConflicts(
      data.driverId,
      data.vehicleId,
      data.dateTime,
      data.approxReturnTime
    );
    if (conflicts) {
      throw new Error('Scheduling conflict detected');
    }
  }

  async checkSchedulingConflicts(driverId, vehicleId, startTime, endTime) {
    const existingSchedule = await mongodbService.findOne(this.collection, {
      $or: [
        { driverId, status: 'active' },
        { vehicleId, status: 'active' }
      ],
      dateTime: { $lte: new Date(endTime) },
      approxReturnTime: { $gte: new Date(startTime) },
      isActive: true,
      deletedAt: null
    });
    return !!existingSchedule;
  }

  async createSchedule(data, userId) {
    await this.validateSchedule(data);

    //formulate startTime from first destination
    let startTime;
    let approxReturnTime;

    //iterate through each destination and get start and end time. where start time is the tripStartTime and end time is the tripApproxArrivalTime
    for (const destination of data.destinations) {
      if (!startTime) {
        startTime = new Date(destination.tripStartTime);
      }
      else if(new Date(destination.tripStartTime) < startTime) {
        startTime = new Date(destination.tripStartTime);
      }

      if(destination.tripApproxArrivalTime) {
      if (!approxReturnTime) {
        approxReturnTime = new Date(destination.tripApproxArrivalTime);
      }
      else if(new Date(destination.tripApproxArrivalTime) > approxReturnTime) {
          approxReturnTime = new Date(destination.tripApproxArrivalTime);
        }
      }

      if(destination.requestId) {
        delete destination.purposeId;
        delete destination.destination;
        delete destination.jobCardId;
        delete destination.noOfPeople;
        delete destination.mapLink;
      }
    }

    const schedule = {
      ...data,
      tripStartTime: startTime?.toISOString(),
      tripApproxReturnTime: approxReturnTime?.toISOString(),
      status: 'scheduled',
      createdBy: userId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      deletedBy: null
    };

     const result = await mongodbService.insertOne(this.collection, schedule);

    // Get request IDs from destinations
    const requestIds = data.destinations
      .filter(dest => dest.requestId)
      .map(dest => dest.requestId);


    // Update trip request statuses
    for (const destination of data.destinations) {
      if(destination.requestId) {
        await tripRequestService.updateTripRequest(destination.requestId, {
          status: 'scheduled',
          linkedTripId: result.insertedId.toString()
        });
      }
    }


    // Send notifications asynchronously
    Promise.all([
      (async () => {
        const destinations = await this.getScheduleDestinationsString(result.insertedId.toString());
        const requestorIds = await this.getRequestorIds(result.insertedId.toString());

        this.sendTripScheduleNotificationsToDrivers(schedule.driverId, schedule.tripStartTime, destinations);
        this.sendTripScheduleNotificationsToRequestors(requestorIds, schedule.tripStartTime, destinations, result.insertedId.toString());
        this.sendTripScheduleNotificationsToAdmins(schedule.tripStartTime, destinations, schedule.createdBy, result.insertedId.toString());
      })()
    ]).catch(error => {
      console.error('Error sending notifications:', error);
    });

    return result;
  }

  async getSchedulesBasic() {
    return mongodbService.find(this.collection, {
      isActive: true,
      deletedAt: null
    });
  }

  async getSchedules(filters = {}) {
    try {
      // Build base query
      const query = {
        isActive: true,
        deletedAt: null
      };
      console.log(filters);

      // Add status filter (support multiple statuses)
      if (filters.status) {
        const statuses = Array.isArray(filters.status) 
          ? filters.status 
          : filters.status.split(',').map(s => s.trim());
        query.status = { $in: statuses };
      }

      // Add date range filter
      if (filters.dateFrom || filters.dateTo) {
        query.tripStartTime = {};
        if (filters.dateFrom) {
          // Set time to start of day
          const fromDate = new Date(filters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          query.tripStartTime.$gte = fromDate;
        }
        if (filters.dateTo) {
          // Set time to end of day
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          query.tripStartTime.$lte = toDate;
        }
      }

      // Add driver filter (support multiple drivers)
      if (filters.driverId) {
        const driverIds = Array.isArray(filters.driverId)
          ? filters.driverId
          : filters.driverId.split(',').map(id => id.trim());
        query.driverId = { $in: driverIds };
      }

      // Add vehicle filter (support multiple vehicles)
      if (filters.vehicleId) {
        const vehicleIds = Array.isArray(filters.vehicleId)
          ? filters.vehicleId
          : filters.vehicleId.split(',').map(id => id.trim());
        query.vehicleId = { $in: vehicleIds };
      }

      //handle pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;
      const options = {
        skip,
        limit
      };

      // Get total count for pagination by getting all documents that match the query
      const allDocuments = await mongodbService.find(this.collection, query);
      const totalCount = allDocuments.length;

      // Get schedules with filters
      const schedules = await mongodbService.find(this.collection, query, options);

      // Extract unique IDs for related data
      const uniqueIds = {
        driverIds: [...new Set(schedules.map(s => s.driverId).filter(Boolean))],
        vehicleIds: [...new Set(schedules.map(s => s.vehicleId).filter(Boolean))],
        createdByUserIds: [...new Set(schedules.map(s => s.createdBy).filter(Boolean))],
        tripRequestIds: [...new Set(schedules.flatMap(s => s.destinations.map(d => d.requestId)).filter(Boolean))],
      };
      // Fetch all related data in parallel and filter out null/undefined values
      const [driversWithNull, vehiclesWithNull, usersWithNull, tripRequestsWithNull] = await Promise.all([
        // Get all drivers
        Promise.all(uniqueIds.driverIds.map(id => driverService.getDriverById(id))),
        // Get all vehicles 
        Promise.all(uniqueIds.vehicleIds.map(id => vehicleService.getVehicleById(id))),
        // Get all users
        Promise.all(uniqueIds.createdByUserIds.map(id => userService.getUserById(id))),
        // Get all trip requests
        Promise.all(uniqueIds.tripRequestIds.map(id => tripRequestService.getTripRequestById(id))),
      ]);

      // Filter out null/undefined values
      const drivers = driversWithNull.filter(Boolean);
      const vehicles = vehiclesWithNull.filter(Boolean);
      const users = usersWithNull.filter(Boolean);
      const tripRequests = tripRequestsWithNull.filter(Boolean);

      let purposeIds = [...new Set(tripRequests.flatMap(s => s.purpose.id))];
      const noRequestPurposeIds = [...new Set(schedules.flatMap(s => s.destinations.map(d => d.purposeId).filter(Boolean)))];
      purposeIds = [...purposeIds, ...noRequestPurposeIds];

      // Get all purposes and filter out null/undefined values
      const purposesWithNull = await Promise.all(purposeIds.map(id => tripPurposeService.getTripPurposeById(id)));
      const purposes = purposesWithNull.filter(Boolean);

      console.log(drivers);

      // Create lookup maps for quick access
      const driverMap = new Map(drivers.map(d => [d._id.toString(), d]));
      const vehicleMap = new Map(vehicles.map(v => [v._id.toString(), v]));
      const userMap = new Map(users.map(u => [u._id.toString(), u]));
      const tripRequestMap = new Map(tripRequests.map(tr => [tr._id.toString(), tr]));

      console.log(purposes);

      // Get unique purpose IDs from trip requests and fetch them
      const purposeMap = new Map(purposes.map(p => [p._id.toString(), p]));

      // Enhance schedules with related data using the maps
      const enhancedSchedules = schedules.map(schedule => {
        const driver = driverMap.get(schedule.driverId);
        const vehicle = vehicleMap.get(schedule.vehicleId);
        const createdByUser = userMap.get(schedule.createdBy?.toString());

        // Map destinations with trip request data
        const destinations = schedule.destinations.map(dest => {
          const tripRequest = tripRequestMap.get(dest.requestId);
          let purpose = null;
          let createdBy = null;
          if(dest.requestId) {
            purpose = tripRequest?.purpose ? purposeMap.get(tripRequest.purpose.id?.toString()) : null;
            createdBy = tripRequest?.createdBy ? userMap.get(tripRequest.createdBy?.toString()) : null;
          }
          else{
            createdBy = userMap.get(schedule.createdBy?.toString());
            purpose = purposeMap.get(dest.purposeId?.toString());
          }
          

          if(dest.requestId) {

          return {
            requestId: dest.requestId,
            time: dest.time,
            destination: tripRequest?.destination || null,
            purpose: purpose ? {
                id: purpose._id,
                name: purpose.name,
                jobCardNeeded: purpose.jobCardNeeded
              } : null,
            tripStartTime: dest.tripStartTime,
            tripApproxArrivalTime: dest.tripApproxArrivalTime,
            tripPurposeTime: dest.tripPurposeTime,
            jobCardId: tripRequest.jobCardId,
            noOfPeople: tripRequest.noOfPeople,
            mapLink: tripRequest.mapLink,
            createdBy: createdBy ? {
              id: createdBy._id,
              name: createdBy.name,
              phone: createdBy.phone
            } : null
          };

        }else{
          return {
            requestId: dest.requestId,
            time: dest.time,
            destination: dest.destination,
            purpose: purpose ? {
                id: purpose._id,
                name: purpose.name,
                jobCardNeeded: purpose.jobCardNeeded
              } : null,
            tripStartTime: dest.tripStartTime,
            tripApproxArrivalTime: dest.tripApproxArrivalTime,
            tripPurposeTime: dest.tripPurposeTime,
            jobCardId: dest.jobCardId,
            noOfPeople: dest.noOfPeople,
            mapLink: dest.mapLink,
            createdBy: createdBy ? {
              id: createdBy._id,
              name: createdBy.name,
              phone: createdBy.phone
            } : null
          };
        }
        });

        return {
          id: schedule._id,
          dateTime: schedule.dateTime,
          approxReturnTime: schedule.approxReturnTime,
          status: schedule.status,
          driver: driver ? {
            id: driver._id,
            name: driver.name,
            phone: driver.phone,
            email: driver.email
          } : null,
          vehicle: vehicle ? {
            id: vehicle._id,
            name: vehicle.name,
            plateNumber: vehicle.plateNumber,
            type: vehicle.type
          } : null,
          createdBy: createdByUser ? {
            id: createdByUser._id,
            name: createdByUser.name,
            phone: createdByUser.phone,
          } : null,
          destinations,
          tripStartTime: schedule.tripStartTime,
          tripApproxReturnTime: schedule.tripApproxReturnTime,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt
        };
      });

      return {
        results: enhancedSchedules,
        pagination: {
          page,
          limit,
          totalResults: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('Get schedules error:', error);
      throw error;
    }
  }

  async getSchedulesV2(filters = {}) {
    try {
      // Build base query
      const query = {
        isActive: true,
        deletedAt: null
      };

      // Add status filter
      if (filters.status) {
        const statuses = Array.isArray(filters.status) 
          ? filters.status 
          : filters.status.split(',').map(s => s.trim());
        query.status = { $in: statuses };
      }

      // Add date range filter
      if (filters.dateFrom || filters.dateTo) {
        query.tripStartTime = {};
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          query.tripStartTime.$gte = fromDate;
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          query.tripStartTime.$lte = toDate;
        }
      }

      // Add driver filter
      if (filters.driverId) {
        query.driverId = Array.isArray(filters.driverId)
          ? { $in: filters.driverId.map(id => new ObjectId(id)) }
          : new ObjectId(filters.driverId);
      }

      // Add vehicle filter
      if (filters.vehicleId) {
        query.vehicleId = Array.isArray(filters.vehicleId)
          ? { $in: filters.vehicleId.map(id => new ObjectId(id)) }
          : new ObjectId(filters.vehicleId);
      }

      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      // Get total count and schedules in parallel
      const [totalCount, schedules] = await Promise.all([
        mongodbService.count(this.collection, query),
        mongodbService.find(this.collection, query, { 
          skip, 
          limit,
          sort: { tripStartTime: -1 } // Add sorting by tripStartTime
        })
      ]);

      if (schedules.length === 0) {
        return {
          results: [],
          pagination: {
            page,
            limit,
            totalResults: 0,
            totalPages: 0
          }
        };
      }

      // Create sets for unique IDs
      const driverIds = new Set();
      const vehicleIds = new Set();
      const createdByIds = new Set();
      const requestIds = new Set();

      // Collect all unique IDs in a single pass
      schedules.forEach(schedule => {
        if (schedule.driverId) driverIds.add(schedule.driverId.toString());
        if (schedule.vehicleId) vehicleIds.add(schedule.vehicleId.toString());
        if (schedule.createdBy) createdByIds.add(schedule.createdBy.toString());

        schedule.destinations.forEach(dest => {
          if (dest.requestId) requestIds.add(dest.requestId.toString());
        });
      });

      // Fetch all related data in parallel
      const [drivers, vehicles, users, tripRequests, purposes] = await Promise.all([
        mongodbService.find('users', {
          _id: { $in: Array.from(driverIds).map(id => new ObjectId(id)) },
          role: 'driver',
        }),
        mongodbService.find('vehicles', {
          _id: { $in: Array.from(vehicleIds).map(id => new ObjectId(id)) },
        }),
        mongodbService.find('users', {
          _id: { $in: Array.from(createdByIds).map(id => new ObjectId(id)) },
        }),
        mongodbService.find('tripRequests', {
          _id: { $in: Array.from(requestIds).map(id => new ObjectId(id)) },
        }),
        mongodbService.find('tripPurposes', {
        })
      ]);

      // Create efficient lookup maps
      const maps = {
        drivers: new Map(drivers.map(d => [d._id.toString(), d])),
        vehicles: new Map(vehicles.map(v => [v._id.toString(), v])),
        users: new Map(users.map(u => [u._id.toString(), u])),
        requests: new Map(tripRequests.map(r => [r._id.toString(), r])),
        purposes: new Map(purposes.map(p => [p._id.toString(), p]))
      };

      // Format schedules with a single pass
      const enhancedSchedules = schedules.map(schedule => ({
        id: schedule._id,
        dateTime: schedule.dateTime,
        approxReturnTime: schedule.approxReturnTime,
        status: schedule.status,
        driver: this.formatEntity(maps.drivers.get(schedule.driverId?.toString()), ['_id', 'name', 'phone', 'email']),
        vehicle: this.formatEntity(maps.vehicles.get(schedule.vehicleId?.toString()), ['_id', 'name', 'plateNumber', 'type']),
        createdBy: this.formatEntity(maps.users.get(schedule.createdBy?.toString()), ['_id', 'name', 'phone']),
        destinations: this.formatDestinations(schedule.destinations, maps),
        tripStartTime: schedule.tripStartTime,
        tripApproxReturnTime: schedule.tripApproxReturnTime,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      }));

      return {
        results: enhancedSchedules,
        pagination: {
          page,
          limit,
          totalResults: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };

    } catch (error) {
      console.error('Get schedules v2 error:', error);
      throw error;
    }
  }

  // Helper functions
  formatEntity(entity, fields) {
    if (!entity) return null;
    const formatted = { id: entity._id };
    fields.forEach(field => {
      if (field !== '_id') formatted[field] = entity[field];
    });
    return formatted;
  }

  formatDestinations(destinations, maps) {
    return destinations.map(dest => {
      const request = dest.requestId ? maps.requests.get(dest.requestId.toString()) : null;
      const purpose = dest.requestId 
        ? maps.purposes.get((maps.requests.get(dest.requestId.toString()).purpose))
        : dest.purposeId 
          ? maps.purposes.get(dest.purposeId.toString())
          : null;
      const createdBy = request?.createdBy 
        ? maps.users.get(request.createdBy.toString())
        : null;

      return {
        requestId: dest.requestId,
        time: dest.time,
        destination: request?.destination || dest.destination,
        purpose: purpose ? {
          id: purpose._id,
          name: purpose.name,
          jobCardNeeded: purpose.jobCardNeeded
        } : null,
        tripStartTime: dest.tripStartTime,
        tripApproxArrivalTime: dest.tripApproxArrivalTime,
        tripPurposeTime: dest.tripPurposeTime,
        jobCardId: request?.jobCardId || dest.jobCardId,
        noOfPeople: request?.noOfPeople || dest.noOfPeople,
        mapLink: request?.mapLink || dest.mapLink,
        createdBy: createdBy ? {
          id: createdBy._id,
          name: createdBy.name,
          phone: createdBy.phone
        } : null
      };
    });
  }

  async getScheduleById(id) {
    return mongodbService.findOne(this.collection, {
      _id: new ObjectId(id),
      isActive: true,
      deletedAt: null
    });
  }

  async getRequestorIds(id) {
    const schedule = await mongodbService.findOne(this.collection, {
      _id: new ObjectId(id),
      isActive: true,
      deletedAt: null
    });

    const requestorIds = schedule.destinations.map(d => d.requestId);
    const tripRequests = await tripRequestService.getTripRequestsByIdsBasic(requestorIds);
    return tripRequests.map(request => request.createdBy);
  }

  async getScheduleDestinationsString(id) {
    const schedule = await mongodbService.findOne(this.collection, {
      _id: new ObjectId(id),
      isActive: true,
      deletedAt: null
    });

    const requestIds = schedule.destinations.map(d => d.requestId);
    const tripRequests = await tripRequestService.getTripRequestsByIdsBasic(requestIds);
    let tripPurposeMap = await tripPurposeService.getTripPurposeMapBasic();
    let tripRequestIdDestinationPurposeMap ={}
    for(const tripRequest of tripRequests) {
      tripRequestIdDestinationPurposeMap[tripRequest._id.toString()] = {
        purpose: tripPurposeMap.get(tripRequest.purpose.toString()),
        destination: tripRequest.destination
      }
    }

    let destinationArray = [];

    for(const destination of schedule.destinations) {
      if(destination.requestId) {
        const tripRequest = tripRequestIdDestinationPurposeMap[destination.requestId];
        destinationArray.push(`• ${tripRequest.destination} - ${tripRequest.purpose.name}`);
      }
      else{
        destinationArray.push(`• ${destination.destination} - ${tripPurposeMap.get(destination.purpose)}`);
      }
    }


    return destinationArray.join('\n');
  }

  async updateSchedule(id, updateData, userId) {

    const existingSchedule = await this.getScheduleById(id);
    if (updateData.dateTime || updateData.approxReturnTime || updateData.driverId || updateData.vehicleId) {
      await this.validateScheduleUpdate({
        ...existingSchedule,
        ...updateData
      });
    }

    const allRequestIds = updateData.destinations.map(d => d.requestId);
    const allExistingRequestIds = existingSchedule.destinations.map(d => d.requestId).filter(Boolean);

    // Find removed destinations - requests that exist in existing schedule but not in update
    const removedRequestId=[];
    for(const requestId of allExistingRequestIds) {
      if(!allRequestIds.includes(requestId)) {
        removedRequestId.push(requestId);
      }
    }

    const newRequestIds=[];
    for(const requestId of allRequestIds) {
      if(requestId && !allExistingRequestIds.includes(requestId)) {
        newRequestIds.push(requestId);
      }
    }

    //update trip request statuses
    for (const requestId of removedRequestId) {
      await tripRequestService.updateTripRequest(requestId, { status: 'pending' , linkedTripId: null}, false);
    }

    //calculate new tripStartTime and tripApproxReturnTime
    let newTripStartTime;
    let newTripApproxReturnTime;

    for (const destination of updateData.destinations) {
      if (!newTripStartTime) {
        newTripStartTime = new Date(destination.tripStartTime);
      }
      else if(new Date(destination.tripStartTime) < newTripStartTime) {
        newTripStartTime = new Date(destination.tripStartTime);
      }

      if(destination.tripApproxArrivalTime) {
      if (!newTripApproxReturnTime) {
        newTripApproxReturnTime = new Date(destination.tripApproxArrivalTime);
      }
      else if(new Date(destination.tripApproxArrivalTime) > newTripApproxReturnTime) {
          newTripApproxReturnTime = new Date(destination.tripApproxArrivalTime);
        }
      }

      if(destination.requestId) {
        delete destination.purposeId;
        delete destination.destination;
        delete destination.jobCardId;
        delete destination.noOfPeople;
        delete destination.mapLink;
      }
    }
    updateData.tripStartTime = newTripStartTime;
    updateData.tripApproxReturnTime = newTripApproxReturnTime;
    
    
    if(updateData.destinations.length === 0) {
      updateData.status = 'cancelled';
    }

    const result = await mongodbService.updateOne(
      this.collection,
      { _id: new ObjectId(id), isActive: true, deletedAt: null },
      {
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      }
    );

    //update trip request statuses
    for (const requestId of newRequestIds) {

      await tripRequestService.updateTripRequest(requestId, { status: 'scheduled' , linkedTripId: id}, false);
    } 

    // Get request IDs from destinations
    const requestIds = updateData.destinations
      .filter(dest => dest.requestId)
      .map(dest => dest.requestId);

    // Notify users about schedule update
    await notificationService.notifyTripRequestUsers(
      requestIds,
      'Trip Schedule Updated',
      'Your scheduled trip has been updated',
      {
        type: 'trip_updated',
        scheduleId: id
      }
    );

        // Send notifications asynchronously
        Promise.all([
          (async () => {
            const destinations = await this.getScheduleDestinationsString(id);
            const requestorIds = await this.getRequestorIds(id);
    
            this.sendTripScheduleNotificationsToDrivers(existingSchedule.driverId, existingSchedule.tripStartTime, destinations);
            this.sendTripScheduleNotificationsToRequestors(requestorIds, existingSchedule.tripStartTime, destinations, id);
            this.sendTripScheduleNotificationsToAdmins(existingSchedule.tripStartTime, destinations, existingSchedule.createdBy, id);
          })()
        ]).catch(error => {
          console.error('Error sending notifications:', error);
        });

    return result;
  }

  async deleteSchedule(id, userId) {
    const schedule = await this.getScheduleById(id);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Update trip request statuses back to pending
    for (const destination of schedule.destinations) {
      await tripRequestService.updateTripRequest(destination.requestId, {
        status: 'pending',
        linkedTripId: null
      });
    }

    return await mongodbService.updateOne(
      this.collection,
      { _id: new ObjectId(id), isActive: true, deletedAt: null },
      {
        $set: {
          isActive: false,
          deletedAt: new Date().toISOString(),
          deletedBy: userId,
          updatedAt: new Date().toISOString()
        }
      }
    );
  }

  async sendTripScheduleNotificationsToDrivers(driverId, tripStartTime, destination) {
    try {
      // Get driver tokens
      const driverTokens = await notificationSettingsService.getNotificationEnabledUsersByIds(
        [driverId],
        'receiveTripScheduledNotfication'
      );

      if (Object.keys(driverTokens).length > 0) {
        const tokens= Object.values(driverTokens).flat();
        const tripDate = new Date(tripStartTime).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });

        await notificationService.sendNotification(
          tokens,
          'New Trip Scheduled',
          `Trip scheduled for ${tripDate}\n${destination}`,
          {
            type: 'trip_scheduled',
            tripDate: tripStartTime,
            formattedTripDate: tripDate
          }
        );
      }

    } catch (error) {
      console.error('Error sending trip schedule notifications to drivers:', error);
      // Don't throw the error as this is a notification function
      // We don't want to fail the trip scheduling if notifications fail
    }
  }

  async sendTripScheduleNotificationsToAdmins(tripStartTime, destination, scheduledBy, scheduleId) {
    
    try {
      // Send notifications to scheduler, admin and super-admin
      const adminTokens = await notificationSettingsService.getNotificationEnabledUsers(
        ['scheduler', 'admin', 'super-admin'],
        'receiveTripScheduledNotfications',
        {notInUserIds: [scheduledBy]}
      );
      if (adminTokens.length > 0) {
        // Format trip date
        const tripDate = new Date(tripStartTime).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });



        await notificationService.sendNotification(
          adminTokens,
          'New Trip Scheduled',
          `Trip scheduled for ${tripDate}\n${destination}`,
          {
            type: 'trip_scheduled',
            tripId: scheduleId,
            tripDate: tripStartTime,
            formattedTripDate: tripDate
          }
        );
      }

    } catch (error) {
      console.error('Error sending trip schedule notifications to requestors:', error);
      // Don't throw the error as this is a notification function
      // We don't want to fail the trip scheduling if notifications fail
    }
  }
  async sendTripScheduleNotificationsToRequestors(requestorIds, tripStartTime, destinations, scheduleId) {
    try {
      // Get requestor tokens
      const requestorTokens = await notificationSettingsService.getNotificationEnabledUsersByIds(
        requestorIds,
        'receiveMyRequestNotification'
      );

      if (Object.keys(requestorTokens).length > 0) {
        const tripDate = new Date(tripStartTime).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });


        await notificationService.sendNotification(
          Object.values(requestorTokens).flat(),
          'Trip Request Scheduled',
          `Your trip request has been scheduled for ${tripDate}.\n${destinations}`,
          {
            type: 'trip_request_scheduled',
            tripId: scheduleId,
            tripDate: tripStartTime,
            formattedTripDate: tripDate,
          }
        );
      }
    } catch (error) {
      console.error('Error sending trip schedule notifications:', error);
      // Don't throw the error as this is a notification function
      // We don't want to fail the trip scheduling if notifications fail
    }
  }

  async checkAvailability(params) {
    try {
      const { vehicleId, driverId, startTime, endTime } = params;
      
      if (!startTime) {
        throw new Error('Start time is required');
      }

      const startDateTime = new Date(startTime);
      const endDateTime = endTime ? new Date(endTime) : new Date(startDateTime.getTime() + (4 * 60 * 60 * 1000));

      // Build query to find conflicting schedules
      const query = {
        isActive: true,
        deletedAt: null,
        status: { $in: ['scheduled', 'started'] },
        $or: [
          {
            tripStartTime: { $lte: endDateTime },
            tripApproxReturnTime: { $gte: startDateTime }
          }
        ]
      };

      // Add vehicle/driver conditions
      if (vehicleId && driverId) {
        query.$or.push(
          { vehicleId: new ObjectId(vehicleId) },
          { driverId: new ObjectId(driverId) }
        );
      } else if (vehicleId) {
        query.vehicleId = new ObjectId(vehicleId);
      } else if (driverId) {
        query.driverId = new ObjectId(driverId);
      } else {
        throw new Error('Either vehicleId or driverId is required');
      }

      // Get conflicting schedules with populated data
      const conflictingSchedules = await mongodbService.find(this.collection, query);

      if (conflictingSchedules.length === 0) {
        return {
          available: true,
          message: 'The requested time slot is available'
        };
      }

      // Get all unique IDs for related data
      const purposeIds = new Set();
      const driverIds = new Set();
      const vehicleIds = new Set();
      const requestIds = new Set();

      conflictingSchedules.forEach(schedule => {
        if (schedule.driverId) driverIds.add(schedule.driverId.toString());
        if (schedule.vehicleId) vehicleIds.add(schedule.vehicleId.toString());
        schedule.destinations.forEach(dest => {
          if (dest.requestId) {
            requestIds.add(dest.requestId.toString());
          } else if (dest.purposeId) {
            purposeIds.add(dest.purposeId.toString());
          }
        });
      });

      // Fetch all related data in parallel
      const [drivers, vehicles, purposes, tripRequests] = await Promise.all([
        mongodbService.find('users', {
          _id: { $in: Array.from(driverIds).map(id => new ObjectId(id)) },
          role: 'driver'
        }),
        mongodbService.find('vehicles', {
        }),
        mongodbService.find('tripPurposes', {
        }),
        mongodbService.find('tripRequests', {
          _id: { $in: Array.from(requestIds).map(id => new ObjectId(id)) }
        })
      ]);

      // Create lookup maps
      const maps = {
        drivers: new Map(drivers.map(d => [d._id.toString(), d])),
        vehicles: new Map(vehicles.map(v => [v._id.toString(), v])),
        purposes: new Map(purposes.map(p => [p._id.toString(), p])),
        requests: new Map(tripRequests.map(r => [r._id.toString(), r]))
      };

      // Add request purposes to purpose map
      tripRequests.forEach(request => {
        if (request.purpose?.id) {
          purposeIds.add(request.purpose.id.toString());
        }
      });

      // Fetch additional purposes if needed
      if (purposeIds.size > purposes.length) {
        const additionalPurposes = await mongodbService.find('tripPurposes', {
          _id: { $in: Array.from(purposeIds).map(id => new ObjectId(id)) }
        });
        additionalPurposes.forEach(purpose => {
          maps.purposes.set(purpose._id.toString(), purpose);
        });
      }

      // Format conflicts with detailed information
      const conflicts = conflictingSchedules.map(schedule => {
        const driver = maps.drivers.get(schedule.driverId?.toString());
        const vehicle = maps.vehicles.get(schedule.vehicleId?.toString());

        // Format destinations with purposes
        const formattedDestinations = schedule.destinations.map(dest => {
          let destination, purpose;

          if (dest.requestId) {
            const request = maps.requests.get(dest.requestId.toString());
            if (request) {
              destination = request.destination;
              purpose = request.purpose 
                ? maps.purposes.get(request.purpose)
                : null;
            }
          } else {
            destination = dest.destination;
            purpose = dest.purposeId 
              ? maps.purposes.get(dest.purposeId.toString())
              : null;
          }

          return {
            destination: destination,
            startTime: dest.tripStartTime,
            endTime: dest.tripApproxReturnTime,
            purpose: purpose ? {
              id: purpose._id,
              name: purpose.name,
              jobCardNeeded: purpose.jobCardNeeded
            } : null
          };
        });

        return {
          scheduleId: schedule._id,
          tripStartTime: schedule.tripStartTime,
          tripEndTime: schedule.tripApproxReturnTime,
          status: schedule.status,
          driver: driver ? {
            id: driver._id,
            name: driver.name,
            phone: driver.phone
          } : null,
          vehicle: vehicle ? {
            id: vehicle._id,
            name: vehicle.name,
            plateNumber: vehicle.plateNumber
          } : null,
          destinations: formattedDestinations
        };
      });

      // Separate conflicts by resource type
      const driverConflicts = conflicts.filter(c => c.driver?.id.toString() === driverId);
      const vehicleConflicts = conflicts.filter(c => c.vehicle?.id.toString() === vehicleId);

      return {
        available: driverConflicts.length > 0 || vehicleConflicts.length > 0 ? false : true,
        conflicts: {
          driver: driverConflicts.length > 0 ? driverConflicts : null,
          vehicle: vehicleConflicts.length > 0 ? vehicleConflicts : null
        },
        message: this.formatConflictMessage(driverConflicts, vehicleConflicts)
      };

    } catch (error) {
      console.error('Check availability error:', error);
      throw error;
    }
  }

  // Helper function to format conflict message
  formatConflictMessage(driverConflicts, vehicleConflicts) {
    const messages = [];

    if (driverConflicts.length > 0) {
      const driver = driverConflicts[0].driver;
      const destinations = driverConflicts[0].destinations
        .map(d => `${d.destination}${d.purpose ? ` (${d.purpose.name})` : ''}`)
        .join(', ');
      messages.push(
        `Driver ${driver.name} is busy with trip to ${destinations} ` +
        `from ${new Date(driverConflicts[0].tripStartTime).toLocaleString()} ` +
        `to ${new Date(driverConflicts[0].tripEndTime).toLocaleString()}`
      );
    }

    if (vehicleConflicts.length > 0) {
      const vehicle = vehicleConflicts[0].vehicle;
      const destinations = vehicleConflicts[0].destinations
        .map(d => `${d.destination}${d.purpose ? ` (${d.purpose.name})` : ''}`)
        .join(', ');
      messages.push(
        `Vehicle ${vehicle.name} (${vehicle.plateNumber}) is scheduled for trip to ${destinations} ` +
        `from ${new Date(vehicleConflicts[0].tripStartTime).toLocaleString()} ` +
        `to ${new Date(vehicleConflicts[0].tripEndTime).toLocaleString()}`
      );
    }

    return messages.join(' and ');
  }

  async checkAllAvailability(params) {
    try {
      const { startTime, endTime } = params;
      
      if (!startTime) {
        throw new Error('Start time is required');
      }

      const startDateTime = new Date(startTime);
      const endDateTime = endTime ? new Date(endTime) : new Date(startDateTime.getTime() + (4 * 60 * 60 * 1000));

      // Get all active drivers and vehicles, and busy schedules in parallel
      const [allDrivers, allVehicles, busySchedules] = await Promise.all([
        mongodbService.find('users', {
          role: 'driver',
          isActive: true,
          deletedAt: null
        }, { projection: { _id: 1, name: 1, phone: 1 } }), // Only get necessary fields
        mongodbService.find('vehicles', {
          isActive: true,
          deletedAt: null
        }, { projection: { _id: 1, name: 1, plateNumber: 1, type: 1 } }), // Only get necessary fields
        mongodbService.find(this.collection, {
          isActive: true,
          deletedAt: null,
          status: { $in: ['scheduled', 'started'] },
          tripStartTime: { $lte: endDateTime },
          tripApproxReturnTime: { $gte: startDateTime }
        }, { projection: { driverId: 1, vehicleId: 1 } }) // Only get IDs
      ]);

      // Create sets of busy IDs for O(1) lookup
      const busyDriverIds = new Set(busySchedules.map(s => s.driverId?.toString()));
      const busyVehicleIds = new Set(busySchedules.map(s => s.vehicleId?.toString()));

      // Format response with minimal information
      const formattedDrivers = allDrivers.map(driver => ({
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        available: !busyDriverIds.has(driver._id.toString())
      }));

      const formattedVehicles = allVehicles.map(vehicle => ({
        id: vehicle._id,
        name: vehicle.name,
        plateNumber: vehicle.plateNumber,
        type: vehicle.type,
        available: !busyVehicleIds.has(vehicle._id.toString())
      }));

      return {
        timeSlot: {
          startTime: startDateTime,
          endTime: endDateTime
        },
        drivers: {
          total: formattedDrivers.length,
          available: formattedDrivers.filter(d => d.available).length,
          busy: formattedDrivers.filter(d => !d.available).length,
          details: formattedDrivers.sort((a, b) => {
            // Sort available drivers first
            if (a.available === b.available) {
              return a.name.localeCompare(b.name);
            }
            return a.available ? -1 : 1;
          })
        },
        vehicles: {
          total: formattedVehicles.length,
          available: formattedVehicles.filter(v => v.available).length,
          busy: formattedVehicles.filter(v => !v.available).length,
          details: formattedVehicles.sort((a, b) => {
            // Sort available vehicles first
            if (a.available === b.available) {
              return a.name.localeCompare(b.name);
            }
            return a.available ? -1 : 1;
          })
        }
      };

    } catch (error) {
      console.error('Check all availability error:', error);
      throw error;
    }
  }
}

module.exports = new TripScheduleService(); 