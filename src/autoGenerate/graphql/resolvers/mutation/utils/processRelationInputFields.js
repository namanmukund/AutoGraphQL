// replaces relation fields in input with the relation object types
import { findIndex, get } from 'lodash';
import { isErrorThrown } from '../../../../../../utils';
import { checkConnectRecordsExistenceInDb } from './checkConnectRecordsExistenceInDb';
import {
  ConnectIdsAlreadyRelatedError,
  ConnectRecordsNotFoundInDBError,
  OneToOneRelationSentInInputAndAsConnectError,
} from '../../../../../../constants/errors';
import QueryController from '../../../controllers/QueryController';
import { getRelationObjectMap } from './getRelationObjectMap';
import { rollBackDocumentSaves } from './rollBackDocumentSaves';
import generateObjectToBeDisconnected from './generateObjectToBeDisconnected';

const validateConnectRecordCount = async (
  connectInputFieldsMap,
  ast,
  typeName,
  authentication,
  allRelationObjectsArray1to1Nested,
  allRelationObjectsArray1toMNested,
) => {
  const {
    connectPromiseArray,
    connectIdsCount,
  } = checkConnectRecordsExistenceInDb(
    connectInputFieldsMap,
    ast,
    typeName,
    authentication,
    allRelationObjectsArray1to1Nested,
    allRelationObjectsArray1toMNested,
  );
  let connectDbRecords;
  try {
    connectDbRecords = await Promise.all(connectPromiseArray);
  } catch (err) {
    throw err;
  }

  let totalRecordsPresent = 0;
  connectDbRecords.forEach((val) => {
    totalRecordsPresent += val;
  });
  if (connectIdsCount !== totalRecordsPresent) {
    throw new ConnectRecordsNotFoundInDBError();
  }
  return true;
};

const validateNestedAlreadyConnectedIds = (
  nestedRelationArray,
  recordToUpdate,
) => {
  const connectIdsAlreadyRelated = [];
  // check if record exist in nested  1to1 or 1toM doc
  if (nestedRelationArray && nestedRelationArray.length) {
    nestedRelationArray.forEach((doc) => {
      const { parentFieldName, typeId, field } = doc;
      const targetField = get(recordToUpdate, `${parentFieldName}`);
      if (targetField) {
        // typeOf can be object and array too
        if (typeof targetField === 'object' && !Array.isArray(targetField)) {
          if (targetField[field] && targetField[field].typeId === typeId) {
            connectIdsAlreadyRelated.push(typeId);
          }
        } else if (Array.isArray(targetField)) {
          const dataToCheck = { [field]: { typeId } };
          if (findIndex(targetField, dataToCheck) !== -1) {
            connectIdsAlreadyRelated.push(typeId);
          }
        }
        // throw error if connect ids already related
        if (connectIdsAlreadyRelated.length) {
          throw new ConnectIdsAlreadyRelatedError({ data: { connectIdsAlreadyRelated } });
        }
      }
    });
  }
  return true;
};
const processRelationInputFields = (
  promiseArray,
  typeName,
  input,
  ast,
  connectInputFieldsMap,
  updateRecordId,
  authentication,
  allRelationObjectsArray1to1 = [],
  allRelationObjectsArray1toM = [],
) => {
  const allRelationObjectsArray1to1Nested = allRelationObjectsArray1to1;
  const allRelationObjectsArray1toMNested = allRelationObjectsArray1toM;
  const finalInput = Object.assign({}, input);
  const nestedDisconnectObjInfo1to1 = {};
  // const allRelationObjectsArray1toM = [];
  const allSavedRelationRecords = [];
  return Promise.all(promiseArray)
    .then(async (values) => {
      // replacing value in relation fields with relation type objects
      /*
         values: [ { type: 'LearningObjective',
    recordType: 'UserActivityDump',
    typeId: 'cjsuws2xn000163rujil1mfcz',
    field: 'learningObjective',
    relationName: 'LearningObjectiveDump',
    additionalRelationFieldsObject: {} } ]
         */
      values.forEach((value) => {
        if (isErrorThrown(value)) {
          throw value;
        }
        if (!value) {
          return;
        }
        let relationValueToInput;
        let relationField;
        if (Array.isArray(value)) {
          relationField = value[0].field;
          relationValueToInput = value.map((elem) => {
            const { type, typeId, additionalRelationFieldsObject } = elem;

            allSavedRelationRecords.push(elem);
            // make rltn value obj with typeId and additional fields.
            const relationInputObject = Object.assign({ type, typeId },
              additionalRelationFieldsObject);
            return relationInputObject;
          });
          allRelationObjectsArray1toM.push(value);
        } else {
          const { type, typeId, additionalRelationFieldsObject, field } = value;
          relationField = field;

          // add additionalRelationFields if present, along with typeId
          relationValueToInput = Object.assign({ type, typeId }, additionalRelationFieldsObject);
          allSavedRelationRecords.push(value);
          allRelationObjectsArray1to1.push(value);
        }
        // replace field value
        finalInput[relationField] = relationValueToInput;
      });
      // check if the records, whose id is sent in connect inputs, exist in db
      await validateConnectRecordCount(
        connectInputFieldsMap,
        ast,
        typeName,
        authentication,
        allRelationObjectsArray1to1Nested,
        allRelationObjectsArray1toMNested,
      );
      // for update record, fetch record to be updated
      let recordToUpdate;
      if (updateRecordId) {
        const queryModel = new QueryController(typeName, { bypass: true });
        recordToUpdate = await queryModel.fetchById(updateRecordId);

        // in case of 1to1 nested array
        validateNestedAlreadyConnectedIds(
          allRelationObjectsArray1to1Nested,
          recordToUpdate,
        );
        // in case of 1toM nested array
        allRelationObjectsArray1toMNested.forEach((nestedRelationArray) => {
          validateNestedAlreadyConnectedIds(
            nestedRelationArray,
            recordToUpdate,
          );
        });
        // id connected from before but different id sent
        if (allRelationObjectsArray1to1Nested && allRelationObjectsArray1to1Nested.length) {
          allRelationObjectsArray1to1Nested.forEach((obj) => {
            const { relationName, parentFieldName, field } = obj;
            // if two way replace and remove connection
            if (
              recordToUpdate && recordToUpdate[parentFieldName] &&
                recordToUpdate[parentFieldName][field] &&
            recordToUpdate[parentFieldName][field].typeId &&
                recordToUpdate[parentFieldName][field].typeId
            ) {
              generateObjectToBeDisconnected(
                ast,
                typeName,
                parentFieldName,
                nestedDisconnectObjInfo1to1,
                relationName,
              );
              Object.keys(nestedDisconnectObjInfo1to1).forEach((key) => {
                Object.assign(nestedDisconnectObjInfo1to1, {
                  [key]: {
                    ...nestedDisconnectObjInfo1to1[key],
                    data: [{
                      type: recordToUpdate[parentFieldName][key].type,
                      typeId: recordToUpdate[parentFieldName][key].typeId,
                    }],
                  },
                });
              });
            }
          });
        }
      }

      // logic for adding connect mutation Ids to input relation fields
      Object.keys(connectInputFieldsMap)
        .forEach((fieldName) => {
          const relatedTypeName = ast[typeName].field[fieldName].type.dataType;
          const fieldRelationName = ast[typeName].relationFields[fieldName];
          let relationValueToInput;
          const connectIdsAlreadyRelated = [];
          // check if field is list type
          if (ast[typeName].field[fieldName].type.isList) {
            const idsToConnect = connectInputFieldsMap[fieldName];
            const relationObjectsArray = [];
            // loop over all ids
            idsToConnect.forEach((idToConnect) => {
              const relationObjectMap = getRelationObjectMap(relatedTypeName, typeName,
                idToConnect, fieldName, fieldRelationName);
              // for update, if connect id is already related the dont add again.
              if (recordToUpdate && recordToUpdate[fieldName] &&
                findIndex(recordToUpdate[fieldName], ['typeId', idToConnect]) >= 0) {
                connectIdsAlreadyRelated.push(idToConnect);
                return null;
              }
              relationValueToInput = {
                type: relationObjectMap.type,
                typeId: relationObjectMap.typeId,
              };
              if (!finalInput[fieldName]) {
                finalInput[fieldName] = [];
              }
              finalInput[fieldName].push(relationValueToInput);
              relationObjectsArray.push(relationObjectMap);
              return null;
            });

            allRelationObjectsArray1toM.push(relationObjectsArray);
          } else {
            const idToConnect = connectInputFieldsMap[fieldName];
            const relationObjectMap = getRelationObjectMap(relatedTypeName, typeName,
              idToConnect, fieldName, fieldRelationName);

            relationValueToInput = {
              type: relationObjectMap.type,
              typeId: relationObjectMap.typeId,
            };

            /* if a reference already exists(field data also sent in input)
               then throw error  */
            if (
              finalInput[fieldName] &&
                  finalInput[fieldName].type &&
                  finalInput[fieldName].typeId
            ) {
              throw new OneToOneRelationSentInInputAndAsConnectError({
                data: {
                  field: fieldName,
                },
              });
            }
            if (recordToUpdate && recordToUpdate[fieldName] &&
                  recordToUpdate[fieldName].typeId === idToConnect) {
              // dont push if already connected
              connectIdsAlreadyRelated.push(idToConnect);
            } else if (recordToUpdate && recordToUpdate[fieldName] &&
                      recordToUpdate[fieldName].typeId) {
              generateObjectToBeDisconnected(
                ast,
                typeName,
                fieldName,
                nestedDisconnectObjInfo1to1,
                fieldRelationName,
              );
              // in this primary and not sub doc, relatedField will act as nestedField
              Object.keys(nestedDisconnectObjInfo1to1).forEach((key) => {
                const {
                  relatedFieldName,
                  nestedFieldName,
                  nestedDataType,
                  isNestedFieldAList,
                } = nestedDisconnectObjInfo1to1[key];
                if (relatedFieldName === fieldName) {
                  Object.assign(nestedDisconnectObjInfo1to1, {
                    [nestedFieldName]: {
                      relatedFieldName: nestedFieldName,
                      relatedDataType: nestedDataType,
                      isRelatedFieldAList: isNestedFieldAList,
                      data: [{
                        type: recordToUpdate[fieldName].type,
                        typeId: recordToUpdate[fieldName].typeId,
                      }],
                    },
                  });
                }
              });
            }
            // throw error if connect ids already related
            if (connectIdsAlreadyRelated.length) {
              throw new ConnectIdsAlreadyRelatedError({ data: { connectIdsAlreadyRelated } });
            }
            // replace input field value
            finalInput[fieldName] = relationValueToInput;
            allRelationObjectsArray1to1.push(relationObjectMap);
          }
        });

      return {
        finalInput,
        allRelationObjectsArray1to1,
        allRelationObjectsArray1toM,
        allSavedRelationRecords,
        nestedDisconnectObjInfo1to1,
      };
    })
    .catch((err) => {
      rollBackDocumentSaves(
        allSavedRelationRecords,
        authentication,
      );
      return err;
    });
};
export { processRelationInputFields };
