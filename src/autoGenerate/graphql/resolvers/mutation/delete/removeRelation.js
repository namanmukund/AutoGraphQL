import { get } from 'lodash';
import { QueryController, MutationController } from '../../../controllers';
import {
  remoteConnectDisconnectRelationHandler,
} from '../utils';
import { getFieldsBeingFetched, getDirectiveArgumentValue, hasDirective } from '../../../../utils';
import { relationDirections } from '../../../../../../constants';
import { ConnectMutationsArgumentsLimitError } from '../../../../../../constants/errors';
import updateAndDecreaseUsageCountInFile from '../utils/updateAndDecreaseUsageCountInFile';
import deleteFromS3 from '../../../../../middlewares/utils/deleteFromS3';
import { getTypeAndRelatedTypesObjectFromConnectArguments } from '../utils/getTypeAndRelatedTypesObjectFromConnectArguments';
import { getReturnObjectForConnectMutation } from '../utils/getReturnObjectForConnectMutation';
import { isRelationBetweenTwoModelsOrNot } from '../utils/isRelationBetweenTwoModelsOrNot';
import { createModifiedParamsBasedOnParams } from '../utils/createModifiedParamsBasedOnParams';
// Roll back the changes made by removeConnectionResolver
const rollBack = () => {
  // @TODO implement rollback.
};

export const removeConnectionFromType = (type, typeId, typeFieldWithRelation,
  relatedTypeId, relationName, historyObject, ast, authentication) => {
  const modelMutations = new MutationController(type, authentication);
  const modelQueries = new QueryController(type, authentication);
  // get field which has the relation
  const astField = get(ast, `${type}.field[${typeFieldWithRelation}]`, null);
  if (!astField) {
    return null;
  }
  const isFieldList = astField.type.isList;
  const updateObject = {};
  const searchObject = { id: typeId };
  if (isFieldList) {
    // if list pull from relation field array
    updateObject.$pull = {};
    updateObject.$pull[typeFieldWithRelation] = { typeId: relatedTypeId };
  } else {
    // if not list set relation field to emtpy object
    updateObject.$set = {};
    updateObject.$set[typeFieldWithRelation] = {};
  }
  // update and return new doc
  return modelMutations.update(searchObject, updateObject, null, null, historyObject)
    .then(() => modelQueries.fetchById(typeId));
};

const removeRelationMutationResolver = (
  root,
  params,
  typeName,
  relatedType,
  relationName,
  info,
  ast,
  authentication,
) => {
  const argumentKeys = Object.keys(params);
  const { history } = params;
  // check for only two fields allowed in connect mutation
  const { directives } = ast[typeName];
  const isVersionModelToBeMade = hasDirective(directives, 'history');
  if (isVersionModelToBeMade) {
    if (argumentKeys.length > 3) {
      throw new ConnectMutationsArgumentsLimitError();
    }
  } else if (argumentKeys.length !== 2) {
    throw new ConnectMutationsArgumentsLimitError();
  }
  /* params are modified because in the arguments if we are passing code then
   modify that argument to its type id */
  return createModifiedParamsBasedOnParams(params, typeName, relatedType).then((modifiedParams) => {
    const relationFieldAndIdObject =
    getTypeAndRelatedTypesObjectFromConnectArguments(modifiedParams, typeName, relatedType);
    const { typeField, relatedTypeField, typeId, relatedTypeId } = relationFieldAndIdObject;
    // check if relation exists and if not then throw error
    return isRelationBetweenTwoModelsOrNot(relationFieldAndIdObject,
      typeName).then(() => {
      // Fields which are requested.
      const { fieldName, fieldNodes } = info;
      const fieldsFetched = getFieldsBeingFetched(fieldNodes);
      const mutationName = fieldName;
      // get relation direction value
      const relationDirection = getDirectiveArgumentValue(ast, typeName,
        typeField, 'relation', 'direction');
      // Check if typeField is remote field
      const remoteRelationHandle = remoteConnectDisconnectRelationHandler(
        modifiedParams,
        typeName,
        typeField,
        relatedType,
        relatedTypeField,
        fieldsFetched,
        mutationName,
        ast,
        authentication,
      );
      // Check if promise is returned.
      if (typeof remoteRelationHandle === 'object' && Promise.resolve(remoteRelationHandle) === remoteRelationHandle) {
        return remoteRelationHandle;
      }

      const promiseArray = [];
      // remove connection from Type
      promiseArray.push(removeConnectionFromType(typeName, typeId, typeField,
        relatedTypeId, relationName, history, ast, authentication));
      // remove connection from RelatedType
      if (relationDirection !== relationDirections.oneWay) {
        promiseArray.push(removeConnectionFromType(relatedType, relatedTypeId, relatedTypeField,
          typeId, relationName, history, ast, authentication));
      } else {
      // fetch related document

        const modelQueries = new QueryController(relatedType, authentication);
        promiseArray.push(modelQueries.fetchById(relatedTypeId));
      }
      return Promise.all(promiseArray).then(async (values) => {
        if (relatedType === 'File') {
          const { id, usageCount, uri } = values[1];
          if (usageCount > 0) {
            // usageCount 1 will get reduced to 0 and file on s3 will be deleted as well
            updateAndDecreaseUsageCountInFile(id, authentication);
            // decreasing the usageCount in values as well as this is what is rendered to the client
            Object.assign(values[1], {
              usageCount: usageCount - 1,
            });
            // if usageCount value before decrement is 1 then this is the case of usage zero
            if (usageCount === 1) {
              const modelMutation = new MutationController('File', authentication);
              await modelMutation.deleteDocument(id);
              await deleteFromS3(uri);
            }
          }
        }
        const returnObject = getReturnObjectForConnectMutation(values, typeName, typeField, typeId,
          relatedType, relatedTypeField, relatedTypeId);
        return returnObject;
      });
    });
  }).catch((err) => {
    // Roll back in case of any error.
    rollBack();
    return err;
  });
};

export default removeRelationMutationResolver;
