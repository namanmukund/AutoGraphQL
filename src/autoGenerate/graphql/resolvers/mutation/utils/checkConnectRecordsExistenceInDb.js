import { camelCase } from 'lodash';
import pluralize from 'pluralize';
import QueryController from '../../../controllers/QueryController';

export const checkConnectRecordsExistenceInDb = (
  connectInputFieldsMap,
  ast,
  typeName,
  authentication,
) => {
  const connectPromiseArray = [];
  // total Records Ids Sent As ConnectInput
  let connectIdsCount = 0;
  Object.keys(connectInputFieldsMap)
    .forEach((fieldName) => {
      const relatedTypeName = ast[typeName].field[fieldName].type.dataType;
      let connectIds = connectInputFieldsMap[fieldName];
      connectIds = Array.isArray(connectIds) ? connectIds : [connectIds];
      connectIdsCount += connectIds.length;
      // Creating new authentication object
      const newAuthentication = Object.assign({}, authentication);
      // Sending mutationOrQueryName as meta to get count
      newAuthentication.mutationOrQueryName = `${camelCase(pluralize(relatedTypeName))}Meta`;
      const modelQueries = new QueryController(relatedTypeName, newAuthentication);
      connectPromiseArray.push(modelQueries.fetchCount({ id: { $in: connectIds } }));
    });
  return { connectPromiseArray, connectIdsCount };
};
