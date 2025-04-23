
const createFuelingRecordNotification = (fuelingRecord) => {
  return `${fuelingRecord.vehicleId.name} has been fueled for Dh ${fuelingRecord.amount} by ${fuelingRecord.fueledBy.name}`;
};

const updateFuelingRecordNotification = (fuelingRecord) => {
  return `${fuelingRecord.vehicleId.name} has been fueled for Dh ${fuelingRecord.amount} by ${fuelingRecord.fueledBy.name}`;
};

const deleteFuelingRecordNotification = (fuelingRecord) => {
  return `${fuelingRecord.vehicleId.name} has been fueled for Dh ${fuelingRecord.amount} by ${fuelingRecord.fueledBy.name}`;
};


module.exports = {
  createFuelingRecordNotification,
  updateFuelingRecordNotification,
  deleteFuelingRecordNotification
};