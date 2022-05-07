import { camelCase, find } from 'lodash';
import pluralize from 'pluralize';
import { QueryController, RemoteController } from '../../controllers';
import { toObject } from '../../../../../utils';
import { validate } from '../../validation';
import { getFieldsBeingFetched, filterRemoteFields } from '../../../utils';
import { PLURAL } from '../../../../../constants/graphqlOperations';

// To find if filters have remote fields.
// @TODO this function assumes only one parameter in filter,
// has to be enhances if there are more parameters.
const hasParamFilterRemoteFields = (
  params,
  ast,
  typeName,
) => {
  let result = false;
  const { filter } = params;
  const { remoteFields } = ast[typeName];
  if (filter) {
    Object.keys(filter).forEach((filterKey) => {
      // Split the filter with '_'
      const filterKeyArray = filterKey.split('_');
      const hasRemote = remoteFields[filterKeyArray[0]];
      result = hasRemote && hasRemote.name;
    });
  }
  return result;
};
/*
params contain information like {
  "filter": {
    "order_gt": 0
  }
}
 */

/*
Info contains data related to following fields
["fieldName","fieldNodes","returnType","parentType","path",
"schema","fragments","operation","variableValues"]
 */
const fetchListQueryResolver = (
  root,
  params,
  typeName,
  info,
  parsedASTMap,
  authentication,
) => {
  const { remoteFields, remoteFieldsApplicationWise } = parsedASTMap[typeName];
  const queryName = info.fieldName;
  const { fieldNodes } = info; // Fields which are requested.
  /*
  fieldsForFetch contains all the fields asked by the client in the following sample format
      {
      "id": true,
      "title": true,
      "topics": {
        "id": true,
        "description": true
      }
    }
   */
  const fieldsForFetch = getFieldsBeingFetched(fieldNodes);

  validate(
    typeName,
    parsedASTMap,
    PLURAL,
    fieldsForFetch,
    authentication,
  );

  const singularQueryName = camelCase(pluralize.singular(queryName));

  // If there are no remote fields, return the result.
  const modelQueries = new QueryController(typeName, authentication);

  const resolverParams = {
    typeName,
    parsedASTMap,
    info,
  };

  if (!Object.keys(remoteFields).length) {
    return modelQueries.fetchMany(params, resolverParams);
  }

  // If there are remote fields
  // Check if filter params have remote fields
  const paramFilterHasRemoteFields = hasParamFilterRemoteFields(
    params,
    parsedASTMap,
    typeName,
  );
  // If filter param has remote fields, query remote app first and then query local application
  if (paramFilterHasRemoteFields) {
    // Query remote first.
    const modelRemote = new RemoteController(paramFilterHasRemoteFields, authentication);
    // Out of all the fields requested, get the fields required.
    const fieldsToQuery = filterRemoteFields(
      typeName,
      paramFilterHasRemoteFields,
      parsedASTMap,
      fieldsForFetch,
    );
    return modelRemote.query(queryName, params, fieldsToQuery).then((values) => {
      if (values.length > 0) {
        // Take out all the id's in an array
        const idArray = values.map((value) => value.id);
        // Fetch local with a list of id's
        const localParams = {
          filter: {
            id_in: idArray,
          },
        };
        return modelQueries.fetchMany(localParams, resolverParams).then((localValues) => {
          if (localValues.length > 0) {
            return localValues.map((localValue) => {
              const remoteValue = find(values, ['id', localValue.id]);
              return { ...toObject(localValue), ...remoteValue };
            });
          }
          return localValues;
        });
      }
      return values;
    }).catch((err) => err);
  }

  // If filter param does not have remote fields
  return modelQueries.fetchMany(params, resolverParams).then((results) => {
    // @TODO can implement a better method using list queries,
    // to avoid multiple calls.
    const promiseArray = results.map((result) => {
      // Create params object.
      const { id } = result;
      const newParam = {
        id,
      };
      const remoteQueryPromiseArray = Object.keys(remoteFieldsApplicationWise).map((applicationName) => {
        const modelRemote = new RemoteController(applicationName, authentication);
        // Out of all the fields requested, get the fields required.
        const fieldsToQuery = filterRemoteFields(
          typeName,
          applicationName,
          parsedASTMap,
          fieldsForFetch,
        );
        return modelRemote.query(singularQueryName, newParam, fieldsToQuery);
      });
      return Promise.all(remoteQueryPromiseArray).then((values) => {
        let mergedValue = {};
        if (values && values.length > 0) {
          values.map((value) => {
            mergedValue = { ...mergedValue, ...value };
            return null;
          });
        }
        // @ TODO In relation fields are queried for,
        // and some fields in relations are local and some are remote,
        // in that case only remote fields are returned.
        return { ...mergedValue, ...toObject(result) };
      });
    });

    return Promise.all(promiseArray);
  }).catch((err) => err);
};

export default fetchListQueryResolver;
