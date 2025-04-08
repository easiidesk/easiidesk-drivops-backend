/**
 * A mongoose schema plugin that transforms objects when converted to JSON
 * - Removes __v, createdAt, updatedAt, and any path that has private: true
 * - Replaces _id with id
 */

const toJSON = (schema) => {
  // Apply the toJSON option to the schema
  schema.options.toJSON = {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      
      // Remove fields with private: true in schema
      const schemaObj = schema.obj;
      Object.keys(schemaObj).forEach((path) => {
        if (schemaObj[path].private) {
          delete ret[path];
        }
      });
      
      return ret;
    },
  };
};

module.exports = toJSON; 