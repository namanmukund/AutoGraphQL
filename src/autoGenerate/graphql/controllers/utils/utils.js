import {
  mergeWith, isPlainObject,
} from 'lodash';
import {
  AdditionalFieldUpdateDeniedError,
  MultipleArrayOperationDeniedError, InvalidArrayUpdateOperationError,
} from '../../../../../constants/errors';
import arrayOperationFunctions from './arrayOperationUtil';

// Split on first underscore
const splitOnFirstUnderscore = (str) => [str.substring(0, str.indexOf('_')), str.substring(str.indexOf('_') + 1)];

// Custom merge which merges nested objects, assigns nested arrays and handle array field updates
const customMerge = (record, input, arrayFieldsArray = []) => {
  const customizer = (objValue, srcValue, key) => {
    if (arrayFieldsArray.includes(key)) {
      return handleArrayField(objValue, srcValue, arrayFieldsArray);
    }
  };
  return mergeWith(record, input, customizer);
};

// Get array field objects
const handleArrayField = (
  record,
  input,
  arrayFieldsArray,
  nestedDisconnectObjInfo = {},
  targetUpdateId,
) => {
  if (isPlainObject(input)) {
    const keys = Object.keys(input);
    if (keys.length > 1) {
      // Check if an update operation is there
      if (keys.length === 2) {
        if (keys.includes('updateWhere') && keys.includes('updateWith')) {
          if (arrayOperationFunctions.update
            && typeof arrayOperationFunctions.update === 'function') {
            return arrayOperationFunctions.update(record,
              input.updateWhere,
              input.updateWith, arrayFieldsArray);
          }
        } else if (keys.includes('updateWhere') || keys.includes('updateWith')) {
          throw new InvalidArrayUpdateOperationError();
        }
      }
      throw new MultipleArrayOperationDeniedError();
    } else if (keys.length === 1) {
      if (keys.includes('updateWhere') || keys.includes('updateWith')) {
        throw new InvalidArrayUpdateOperationError();
      } else if (arrayOperationFunctions[keys[0]]
        && typeof arrayOperationFunctions[keys[0]] === 'function') {
        return arrayOperationFunctions[keys[0]](
          record,
          input[keys[0]],
          arrayFieldsArray,
          nestedDisconnectObjInfo,
          targetUpdateId,
        );
      }
    }
  }
  return record;
};

// Get updated record object
const getUpdatedRecordObject = (
  input,
  record,
  relationFieldsArray,
  additionalRelationFieldsArray,
  arrayFieldsArray,
  nestedDisconnectObjInfo,
) => {
  const recordDoc = record;
  Object.keys(input).forEach((field) => {
    // to make sure same reference is not added
    if (relationFieldsArray.includes(field) && arrayFieldsArray.includes(field)) {
      const allReferencedIds = record[field].map((reference) => reference.typeId);
      input[field].forEach((reference) => {
        if (!allReferencedIds.includes(reference.typeId)) {
          record[field].push(reference);
        }
      });
    } else if (isPlainObject(input[field]) && !arrayFieldsArray.includes(field)) {
      if (additionalRelationFieldsArray.includes(field)) {
        if (record[field].type && record[field].typeId) {
          Object.keys((input[field])).forEach((additionalField) => {
            if (arrayFieldsArray.includes(additionalField)) {
              recordDoc[field][additionalField] = handleArrayField(record[field][additionalField],
                input[field][additionalField],
                arrayFieldsArray);
            } else {
              recordDoc[field][additionalField] = input[field][additionalField];
            }
          });
        } else {
          throw new AdditionalFieldUpdateDeniedError({
            data: {
              message: `No relation exists for field ${field}`,
            },
          });
        }
      } else {
        recordDoc.set([field], customMerge(recordDoc[field], input[field], arrayFieldsArray));
      }
    } else if (arrayFieldsArray.includes(field)) {
      if (additionalRelationFieldsArray.includes(field)) {
        const inputId = input[field].id;
        const recordFieldIndex = Array.isArray(record[field])
          && record[field].findIndex((rec) => rec.typeId === inputId);
        if (recordFieldIndex >= 0 && record[field][recordFieldIndex].type
            && record[field][recordFieldIndex].typeId) {
          Object.keys((input[field])).forEach((additionalField) => {
            if (additionalField === 'id') {
              return;
            }
            if (arrayFieldsArray.includes(additionalField)) {
              recordDoc[field][recordFieldIndex][additionalField] = handleArrayField(record[field][recordFieldIndex][additionalField],
                input[field][additionalField], arrayFieldsArray);
            } else {
              recordDoc[field][recordFieldIndex][additionalField] = input[field][additionalField];
            }
          });
        } else {
          throw new AdditionalFieldUpdateDeniedError({
            data: {
              message: `No relation exists for field ${field}`,
            },
          });
        }
      } else {
        recordDoc[field] = handleArrayField(
          record[field],
          input[field],
          arrayFieldsArray,
          nestedDisconnectObjInfo,
          recordDoc.id,
        );
      }
    } else if (!input[field]) {
      if (input[field] !== 0 && input[field] !== false) {
        recordDoc[field] = undefined;
      } else {
        recordDoc[field] = input[field];
      }
    } else {
      recordDoc[field] = input[field];
    }
  });
  return recordDoc;
};

export {
  handleArrayField,
  getUpdatedRecordObject,
  splitOnFirstUnderscore,
  customMerge,
};
