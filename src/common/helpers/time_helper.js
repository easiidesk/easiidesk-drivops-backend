const moment = require("moment-timezone");

const getCurrentTime = () => {
  // Get Dubai time as a moment object
  const dubaiMoment = moment().tz("Asia/Dubai");
  
  // Log the string representation for debugging
  console.log("Current GST Time:", dubaiMoment.format());
  
  // Create a Date object with Dubai time as the UTC time
  const year = dubaiMoment.year();
  const month = dubaiMoment.month(); // moment months are 0-indexed
  const day = dubaiMoment.date();
  const hour = dubaiMoment.hour();
  const minute = dubaiMoment.minute();
  const second = dubaiMoment.second();
  const millisecond = dubaiMoment.millisecond();
  
  // Create a Date object using UTC to preserve the Dubai time values
  const dubaiDateUTC = new Date(Date.UTC(year, month, day, hour, minute, second, millisecond));
  
  console.log("Dubai Date for MongoDB:", dubaiDateUTC);
  return dubaiDateUTC;
}

const convertUTCToDubaiTime = (date) => {
  return moment.utc(date).tz("Asia/Dubai").toDate();
}

module.exports = {
  getCurrentTime,
  convertUTCToDubaiTime
}