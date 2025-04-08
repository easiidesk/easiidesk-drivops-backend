const yup = require('yup');

const tripScheduleSchema = yup.object().shape({
  driverId: yup.string().required('Driver ID is required'),
  vehicleId: yup.string().required('Vehicle ID is required'),
  destinations: yup.array().of(
    yup.object().shape({
      requestId: yup.string().nullable().optional(),
      tripStartTime: yup.date().required('Destination start time is required'),
      tripApproxArrivalTime: yup.date().optional().nullable(),
      tripPurposeTime: yup.number().optional().nullable(),
    })
  ).required('At least one destination is required'),
  isActive: yup.boolean().default(true),
  createdAt: yup.date().default(() => new Date()),
  updatedAt: yup.date().default(() => new Date()),
  deletedAt: yup.date().nullable().default(null),
  deletedBy: yup.string().nullable().default(null)
});

const tripScheduleUpdateSchema = yup.object().shape({
  driverId: yup.string().optional().nullable(),
  vehicleId: yup.string().optional().nullable(),
  destinations: yup.array().of(
    yup.object().shape({
      requestId: yup.string().nullable().optional(),
      tripStartTime: yup.date().required('Destination start time is required'),
      tripApproxArrivalTime: yup.date().optional().nullable(),
      tripPurposeTime: yup.number().optional().nullable(),
    })
  ).required('At least one destination is required')
});

module.exports = {
  tripScheduleSchema,
  tripScheduleUpdateSchema
}; 