import pluralize from 'pluralize';
import { camelCase } from 'lodash';
import callGraphqlApi from '../../../../../api/callGraphqlApi';
import { genericFilterQueryToGetIds } from '../../../../../api/queries';
import { QueryController, MutationController } from '../../../controllers';
import {
  remoteConnectDisconnectRelationHandler,
  updateAndIncreaseUsageCountInFile,
} from '../utils';
import { getFieldsBeingFetched, getDirectiveArgumentValue } from '../../../../utils';
import { relationDirections } from '../../../../../../constants';
import { ConnectionAlreadyExistError } from '../../../../../../constants/errors';
import { removeConnectionFromType } from '../delete/removeRelation';
import { getTypeAndRelatedTypesObjectFromConnectArguments } from '../utils/getTypeAndRelatedTypesObjectFromConnectArguments';
import { getReturnObjectForConnectMutation } from '../utils/getReturnObjectForConnectMutation';
import { createModifiedParamsBasedOnParams } from '../utils/createModifiedParamsBasedOnParams';
import { getIdsFromData } from '../utils/getIdsFromData';
import { relationObjectFields } from '../utils/relationObjectFields';
// Roll back the changes made by addConnectionResolver
const rollBack = () => {
  // @TODO implement rollback.
};

// Fetch old related type id
const fetchOldRelatedTypeId = async (typeName, id, field) => {
  const caseTypeName = camelCase(typeName);
  const query = `query{
    ${caseTypeName}(id:"${id}"){
      ${field}{
        id
      }
    }
  }`;
  const res = await callGraphqlApi(query);
  const data = res && res.data && res.data[caseTypeName] && res.data[caseTypeName][field];
  let ids = [];
  if (data) {
    if (Array.isArray(data)) {
      ids = data.map(singleData => singleData.id);
    } else {
      ids = [data.id];
    }
  }
  return ids;
};

const addConnectionToType = (type, typeFieldWithRelation, typeId, relatedType,
  relatedTypeId, additionalRelationFields, relationName,
  saveHistoryObject, ast, authentication) => {
  const modelMutations = new MutationController(type, authentication);
  // set relation object
  let relationObjectToAdd = relationObjectFields(relatedType, relatedTypeId);
  // append additional fields object
  const additionalRelationFieldsInputObject = {};
  Object.keys(additionalRelationFields).forEach((key) => {
    // get field name
    const additionalFieldName = key.split('_')[1];
    additionalRelationFieldsInputObject[additionalFieldName] = additionalRelationFields[key];
  });
  relationObjectToAdd = Object.assign(relationObjectToAdd, additionalRelationFieldsInputObject);
  const arrayFieldsArray = [];
  // if field type is array, set relation Object to an array
  const isFieldList = ast[type].field[typeFieldWithRelation].type.isList;
  if (isFieldList) {
    relationObjectToAdd = [relationObjectToAdd];
    arrayFieldsArray.push(typeFieldWithRelation);
  }
  const updateObject = {};

  updateObject[typeFieldWithRelation] = relationObjectToAdd;
  return modelMutations
    .updateDocument(typeId, updateObject, [typeFieldWithRelation], [],
      arrayFieldsArray, saveHistoryObject)
    .then(async (res) => {
      if (res && relatedType === 'File') {
        await updateAndIncreaseUsageCountInFile(relatedTypeId, authentication);
      }
      return res;
    });
};

export const getAdditionalRelationFieldsFromConnectArgs = (field, type, params) => {
  const paramKeys = Object.keys(params);
  let additionalRelationFieldsObject = {};
  paramKeys.forEach((key) => {
    // skip if key is not additionaFields type
    if (key !== `${field}${type}Fields`) {
      return;
    }

    additionalRelationFieldsObject = params[key];
  });
  return additionalRelationFieldsObject;
};

/* return true if the id is present with which you want to create the connection
else return false */
const isConnectionAlreadyPresentBetweenModels = (relationObject, typeName, typeField) => {
  const { typeId, relatedTypeId } = relationObject;
  const modelPlural = camelCase(pluralize(typeName));
  const typeFilterQuery = genericFilterQueryToGetIds(modelPlural, typeField, relatedTypeId);
  return callGraphqlApi(typeFilterQuery).then((res) => {
    const data = res.data[modelPlural];
    const ids = getIdsFromData(data);
    return ids.includes(`"${typeId}"`);
  });
};
const addRelationMutationResolver = (
  root,
  params,
  typeName,
  relatedType,
  relationName,
  typeField,
  relatedTypeField,
  info,
  ast,
  authentication,
) => {
  const inputParams = params;
  const { history } = params;
  const typeNameString = camelCase(typeName);
  const relatedTypeString = camelCase(relatedType);
  /* params are modified because in the arguments if we are passing code then
   modify that argument to its type id */
  return createModifiedParamsBasedOnParams(inputParams, typeNameString, relatedTypeString)
    .then((modifiedParams) => {
      const relationIdObject = getTypeAndRelatedTypesObjectFromConnectArguments(
        modifiedParams,
        typeNameString,
      );

      const { typeId, relatedTypeId } = relationIdObject;
      // to know if the connection ids already exist then throw error
      return isConnectionAlreadyPresentBetweenModels(relationIdObject, typeName, typeField)
        .then(async (relationExistOrNot) => {
          if (relationExistOrNot) {
            throw new ConnectionAlreadyExistError({
              data: {
                typeName, relatedType,
              },
            });
          }
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
          // NOTE: typename is the type of related type fields, relatedType is type of typeField

          // Check if promise is returned.
          if (typeof remoteRelationHandle === 'object' && Promise.resolve(remoteRelationHandle) === remoteRelationHandle) {
            return remoteRelationHandle;
          }
          // get additional fields arguments
          // args: field and the typeof the field
          const additionalRelationFields = getAdditionalRelationFieldsFromConnectArgs(typeField,
            relatedType, params);
          const additionalRelationFieldsInRelated = getAdditionalRelationFieldsFromConnectArgs(
            relatedTypeField, typeName, params);

          // If typeField is local field
          const promiseArray = [];
          // remove connection from Type
          let isRelationFieldList = ast[typeName].field[typeField].type.isList;
          if (!isRelationFieldList) {
            const oldRelatedTypeIds = await fetchOldRelatedTypeId(typeName,
              typeId, typeField);
            if (oldRelatedTypeIds && oldRelatedTypeIds.length) {
              oldRelatedTypeIds.forEach((oldRelatedTypeId) => {
                promiseArray.push(removeConnectionFromType(relatedType, oldRelatedTypeId,
                  relatedTypeField, typeId, relationName, history, ast, authentication));
              });
            }
          }
          // add connection to Type
          promiseArray.push(addConnectionToType(typeName, typeField, typeId, relatedType,
            relatedTypeId, additionalRelationFields,
            relationName, history, ast, authentication));
          // add connection to RelatedType if relation isnt one way
          if (relationDirection !== relationDirections.oneWay) {
            // remove connection from Type
            isRelationFieldList = ast[relatedType].field[relatedTypeField].type.isList;
            if (!isRelationFieldList) {
              const oldRelatedTypeIds = await fetchOldRelatedTypeId(relatedType,
                relatedTypeId, relatedTypeField);
              if (oldRelatedTypeIds && oldRelatedTypeIds.length) {
                oldRelatedTypeIds.forEach((oldRelatedTypeId) => {
                  promiseArray.push(removeConnectionFromType(typeName, oldRelatedTypeId, typeField,
                    relatedTypeId, relationName, history, ast, authentication));
                });
              }
            }
            // add connection to Type
            promiseArray.push(addConnectionToType(relatedType, relatedTypeField, relatedTypeId,
              typeName, typeId, additionalRelationFieldsInRelated,
              relationName, history, ast, authentication));
          } else {
          // fetch related document
            const modelQueries = new QueryController(relatedType, authentication);
            promiseArray.push(modelQueries.fetchById(relatedTypeId));
          }

          return Promise.all(promiseArray).then((values) => {
            /* since relatedType is file and and the mutation is addRelation hence
             increasing the usageCount in values as this is what is rendered to the client
            */
            if (relatedType === 'File') {
              const { usageCount } = values[1];
              if (usageCount >= 0) {
                Object.assign(values[1], {
                  usageCount: usageCount + 1,
                });
              }
            }
            const returnObject = getReturnObjectForConnectMutation(
              values,
              typeNameString,
              typeField,
              typeId,
              relatedTypeString,
              relatedTypeField,
              relatedTypeId,
            );
            return returnObject;
          });
        });
    }).catch((err) => {
      // Roll back in case of any error.
      rollBack();
      return err;
    });
};

export default addRelationMutationResolver;
