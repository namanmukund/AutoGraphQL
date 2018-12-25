import fetchSchema from 'fetch-graphql-schema';
import { fetchRetries, fetchRetryDelay } from '../constants';

export const makeSchemaMap = (remoteSchema) => {
  /* eslint-disable no-underscore-dangle */
  const schemaTypes = remoteSchema.data.__schema.types;
  /* eslint-enable */
  const schemaMap = {};
  schemaTypes.forEach((schemaType) => {
    if (schemaType.kind !== 'OBJECT') {
      return null;
    }
    const fieldsArray = schemaType.fields;
    if (!fieldsArray || !fieldsArray.length) {
      return null;
    }
    schemaMap[schemaType.name] = {};
    const fieldsObject = {};
    fieldsArray.forEach((field) => {
      fieldsObject[field.name] = true;
    });
    schemaMap[schemaType.name].fields = fieldsObject;
    return null;
  });
  return schemaMap;
};

const getRemoteSchema = uriRemote => new Promise(((resolve, reject) => {
  const wrappedFetch = (n) => {
    fetchSchema(uriRemote)
      .then((schema) => {
        const remoteSchema = JSON.parse(schema);
        const schemaMap = makeSchemaMap(remoteSchema);
        resolve(schemaMap);
      })
      .catch((error) => {
        if (n > 0) {
          setTimeout(() => {
            const i = n - 1;
            wrappedFetch(i);
          }, fetchRetryDelay);
        } else {
          reject(error);
        }
      });
  };
  wrappedFetch(fetchRetries);
}));

export default getRemoteSchema;
