// replaces relation fields in input with the relation object types
import { findIndex } from 'lodash';
import { isErrorThrown } from '../../../../../../utils';
import { checkConnectRecordsExistenceInDb } from './checkConnectRecordsExistenceInDb';
import {
  ConnectIdsArleadyRelatedError,
  ConnectRecordsNotFoundInDBError,
  OneToOneRelationSentInInputAndAsConnectError,
} from '../../../../../../constants/errors';
import QueryController from '../../../controllers/QueryController';
import { getRelationObjectMap } from './getRelationObjectMap';
import { rollBackDocumentSaves } from './rollBackDocumentSaves';

const processRelationInputFields = (promiseArray, typeName, input,
  ast, connectInputFieldsMap, updateRecordId, authentication, allRelationObjectsArray1toM = []) => {
  const finalInput = Object.assign({}, input);
  const allRelationObjectsArray1to1 = [];
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
      const {
        connectPromiseArray,
        connectIdsCount,
      } = checkConnectRecordsExistenceInDb(
        connectInputFieldsMap,
        ast,
        typeName,
        authentication,
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
      // for update record, fetch record to be updated
      let recordToUpdate;
      if (updateRecordId) {
        const queryModel = new QueryController(typeName, { bypass: true });
        recordToUpdate = await queryModel.fetchById(updateRecordId);
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
            } else {
              // replace input field value
              finalInput[fieldName] = relationValueToInput;
              allRelationObjectsArray1to1.push(relationObjectMap);
            }
          }
          // throw error if connect ids already related
          if (connectIdsAlreadyRelated.length) {
            throw new ConnectIdsArleadyRelatedError({ data: { connectIdsAlreadyRelated } });
          }
        });

      return {
        finalInput,
        allRelationObjectsArray1to1,
        allRelationObjectsArray1toM,
        allSavedRelationRecords,
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
