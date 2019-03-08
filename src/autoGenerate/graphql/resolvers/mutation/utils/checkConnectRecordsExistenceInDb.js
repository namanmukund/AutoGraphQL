import { camelCase, uniq } from 'lodash';
import pluralize from 'pluralize';
import QueryController from '../../../controllers/QueryController';

const getConnectCountInfo = (
  authentication,
  relatedTypeName,
  connectIds,
  connectPromiseArray,
) => {
  // Creating new authentication object
  const newAuthentication = Object.assign({}, authentication);
  // Sending mutationOrQueryName as meta to get count
  newAuthentication.mutationOrQueryName = `${camelCase(pluralize(relatedTypeName))}Meta`;
  const modelQueries = new QueryController(relatedTypeName, newAuthentication);
  connectPromiseArray.push(modelQueries.fetchCount({ id: { $in: connectIds } }));
};

const getRelatedTypeWithConnectIds = (
  authentication,
  nestedRelationArray,
  connectPromiseArray,
) => {
  const getRelatedConnectObj = {};
  let connectIdsCount = 0;
  // nestedRelationArray can be [{}, {}]
  nestedRelationArray.forEach((obj) => {
    const { type: relatedTypeName, typeId } = obj;
    if (getRelatedConnectObj[relatedTypeName]) {
      getRelatedConnectObj[relatedTypeName].connectIds = [
        ...getRelatedConnectObj[relatedTypeName].connectIds,
        typeId,
      ];
    } else {
      Object.assign(getRelatedConnectObj, {
        [relatedTypeName]: {
          connectIds: [typeId],
        },
      });
    }
  });
  Object.keys(getRelatedConnectObj).forEach((relatedTypeName) => {
    const { connectIds } = getRelatedConnectObj[relatedTypeName];
    // check for unique connectIds in input
    if (connectIds.length !== uniq(connectIds).length) {
      throw new Error('Duplicate error');
    }
    // update the count
    console.log(3333333, connectIdsCount, '......connectIds', connectIds);

    connectIdsCount += connectIds.length;
    // update connectPromiseArray
    getConnectCountInfo(
      authentication,
      relatedTypeName,
      connectIds,
      connectPromiseArray,
    );
  });
  return connectIdsCount;
};

export const checkConnectRecordsExistenceInDb = (
  connectInputFieldsMap,
  ast,
  typeName,
  authentication,
  allRelationObjectsArray1to1Nested,
  allRelationObjectsArray1toMNested,
) => {
  const connectPromiseArray = [];
  // total Records Ids Sent As ConnectInput
  let connectIdsCount = 0;
  Object.keys(connectInputFieldsMap)
    .forEach((fieldName) => {
      const relatedTypeName = ast[typeName].field[fieldName].type.dataType;
      let connectIds = connectInputFieldsMap[fieldName];
      connectIds = Array.isArray(connectIds) ? connectIds : [connectIds];
      if (connectIds.length !== uniq(connectIds).length) {
        throw new Error('Duplicate error');
      }
      console.log(connectIdsCount, '......connectIds', connectIds);
      connectIdsCount += connectIds.length;
      getConnectCountInfo(
        authentication,
        relatedTypeName,
        connectIds,
        connectPromiseArray,
      );
    });

  if (allRelationObjectsArray1to1Nested && allRelationObjectsArray1to1Nested.length) {
    connectIdsCount += getRelatedTypeWithConnectIds(
      authentication,
      allRelationObjectsArray1to1Nested,
      connectPromiseArray,
    );
  }

  if (allRelationObjectsArray1toMNested && allRelationObjectsArray1toMNested.length) {
    allRelationObjectsArray1toMNested.forEach((doc) => {
      connectIdsCount += getRelatedTypeWithConnectIds(
        authentication,
        doc,
        connectPromiseArray,
      );
    });
  }
  console.log('connectPromiseArray', connectPromiseArray);
  console.log('connectIdsCount', connectIdsCount);

  return { connectPromiseArray, connectIdsCount };
};

