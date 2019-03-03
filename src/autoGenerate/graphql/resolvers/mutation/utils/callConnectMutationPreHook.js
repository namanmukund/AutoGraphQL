import { getRelatedFieldName } from './getRelatedFieldName';
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
    field,
    relationName,
  } = relationObjectMap;

  const data = {};
  const relatedFieldName = getRelatedFieldName(ast[relatedTypeName].relationFields,
    relationName);
  const relationFieldType = `${relatedFieldName}${typeName}Id`;
  const relatedRelationFieldName = `${field}${relatedTypeName}Id`;
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
