const yup = require('yup');

const driverSchema = yup.object().shape({
  name: yup.string().required('Driver name is required'),
  isActive: yup.boolean().default(true),
  createdAt: yup.date().default(() => new Date()),
  updatedAt: yup.date().default(() => new Date()),
  deletedAt: yup.date().nullable()
});

const createDriverSchema = yup.object().shape({
  name: yup.string().required('Driver name is required')
});

const updateDriverSchema = yup.object().shape({
  name: yup.string().required('Driver name is required')
});

module.exports = {
  driverSchema,
  createDriverSchema,
  updateDriverSchema
}; 