import { camelCase } from 'lodash';
import { prehook } from '../../../hooks';
import { isErrorThrown } from '../../../../../../utils';

const callConnectMutationPreHook = async (
  updateRecordId,
  relationObjectMap,
  finalInput,
  mutationType,
  ast,
  context,
) => {
  // data will contain the 2 arguments which are used in addTo api
  const {
    type: relatedTypeName,
    recordType: typeName,
    typeId: idToConnect,
    relationName,
  } = relationObjectMap;

  const data = {};
  const relationFieldType = `${camelCase(typeName)}Id`;
  const relatedRelationFieldName = `${camelCase(relatedTypeName)}Id`;
  data[relationFieldType] = updateRecordId;
  data[relatedRelationFieldName] = idToConnect;

  const mutationName = `addTo${relationName}`;

  const hookResult = await prehook(data, mutationName, context, data);
  if (isErrorThrown(hookResult)) {
    throw hookResult;
  }
  return hookResult;
};

export default callConnectMutationPreHook;
