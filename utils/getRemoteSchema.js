import fetch from 'node-fetch';
import { getIntrospectionQuery } from 'graphql';
import { fetchRetries, fetchRetryDelay } from '../constants';

export const makeSchemaMap = (remoteSchema) => {
  const schemaTypes = remoteSchema?.data?.__schema?.types || [];
  const schemaMap = {};
  schemaTypes.forEach((schemaType) => {
    if (schemaType.kind !== 'OBJECT') {
      return;
    }
    const fieldsArray = schemaType.fields;
    if (!fieldsArray || !fieldsArray.length) {
      return;
    }
    schemaMap[schemaType.name] = {};
    const fieldsObject = {};
    fieldsArray.forEach((field) => {
      fieldsObject[field.name] = true;
    });
    schemaMap[schemaType.name].fields = fieldsObject;
  });
  return schemaMap;
};

const getRemoteSchema = (uriRemote) => new Promise((resolve, reject) => {
  const wrappedFetch = (n) => {
    fetch(uriRemote, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: getIntrospectionQuery() }),
    })
      .then((res) => res.json())
      .then((remoteSchema) => {
        const schemaMap = makeSchemaMap(remoteSchema);
        resolve(schemaMap);
      })
      .catch((error) => {
        if (n > 0) {
          setTimeout(() => {
            wrappedFetch(n - 1);
          }, fetchRetryDelay);
        } else {
          reject(error);
        }
      });
  };
  wrappedFetch(fetchRetries);
});

export default getRemoteSchema;
