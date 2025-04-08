const yup = require('yup');
const { ObjectId } = require('mongodb');

const tripRequestSchema = yup.object().shape({
  destination: yup.string().required('Destination is required'),
  mapLink: yup.string().url('Map link must be a valid URL'),
  dateTime: yup.string().required('Date and time is required'),
  purpose: yup.string().required('Purpose is required'),
  jobCardId: yup.string(),
  noOfPeople: yup.number().integer().min(1).required('Number of people is required'),
  requiredVehicle: yup.array().of(yup.string()).required('At least one vehicle is required'),
  createdBy: yup.string().required('Created by is required'),
  status: yup.string().oneOf(['pending', 'scheduled', 'cancelled']).default('pending'),
  linkedTrip: yup.string().nullable(),
  createdAt: yup.date().default(() => new Date()),
  modifiedAt: yup.date().default(() => new Date()),
  deletedAt: yup.date().nullable()
});

const createTripRequestSchema = yup.object().shape({
  destination: yup.string().required('Destination is required'),
  dateTime: yup.string().required('Date and time is required'),
  purpose: yup.string().required('Purpose is required'),
  jobCardId: yup.string().nullable(),
  noOfPeople: yup.number().integer().min(1).required('Number of people is required'),
  requiredVehicle: yup.array().of(yup.string()).required('At least one vehicle is required')
});

const updateTripRequestSchema = yup.object().shape({
  destination: yup.string().optional(),
  mapLink: yup.string().optional().nullable(),
  dateTime: yup.string().optional(),
  purpose: yup.string().optional().nullable(),
  jobCardId: yup.string().nullable().optional().nullable(),
  noOfPeople: yup.number().integer().optional().nullable(),
  requiredVehicle: yup.array().of(yup.string()).optional().nullable(),
  status: yup.string().oneOf(['pending', 'scheduled', 'cancelled']),
  linkedTrip: yup.string().nullable().optional()
});

module.exports = {
  tripRequestSchema,
  createTripRequestSchema,
  updateTripRequestSchema
}; 