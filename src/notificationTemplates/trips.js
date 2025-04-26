const { formatDuration } = require('../common/helpers/time_helper');
const createTripStartedNotification = (trip) => {
  const tripData = typeof trip === 'string' ? JSON.parse(trip) : trip;
  const destinations = tripData.destinations.map(d => d.destinations.map(dest => dest.destination)).flat().join(' - ');
  return `• Vehicle: ${tripData.vehicle.name}\n• Destinations: ${destinations}`;
};

const createTripEndedNotification = (trip) => {
  const tripData = typeof trip === 'string' ? JSON.parse(trip) : trip;
  const destinations = tripData.destinations.map(d => d.destinations.map(dest => dest.destination)).flat().join(' - ');
  const duration = Math.round((new Date(tripData.actualTrip.actualEndTime) - new Date(tripData.actualTrip.actualStartTime)) / (1000 * 60));
  return `• Vehicle: ${tripData.vehicle.name}\n• Destinations: ${destinations}\n• Distance: ${tripData.actualTrip.distanceTraveled}km (${formatDuration(duration)})`;
};

  
  module.exports = {
    createTripStartedNotification,
    createTripEndedNotification
  };