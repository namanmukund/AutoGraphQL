import {
  mergeWith, isPlainObject, isMatch, find,
} from 'lodash';
import {
  AdditionalFieldUpdateDeniedError,
  MultipleArrayOperationDeniedError, InvalidArrayUpdateOperationError,
} from '../../../../../constants/errors';
import arrayOperationFunctions from './arrayOperationUtil';

// Split on first underscore
const splitOnFirstUnderscore = (str) => [str.substring(0, str.indexOf('_')), str.substring(str.indexOf('_') + 1)];

/* eslint-disable no-use-before-define */
// Custom merge which merges nested objects, assigns nested arrays and handle array field updates
const customMerge = (record, input, arrayFieldsArray = []) => {
  /* eslint-disable consistent-return */
  // lodash mergeWith customizer
  // If current field is an array field handle it using our handleArrayField method logic
  // else let lodash handle merge accordingly
  const customizer = (objValue, srcValue, key) => {
    if (arrayFieldsArray.includes(key)) {
      return handleArrayField(objValue, srcValue, arrayFieldsArray);
    }
  };
  /* eslint-enable consistent-return */
  return mergeWith(record, input, customizer);
};
/* eslint-enable no-use-before-define */

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
        } else if (keys.includes('updateWhere') || keys.includes('updateWhere')) {
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
      // if reference already in record field, then dont push to record
      const allReferencedIds = record[field].map((reference) => reference.typeId);
      input[field].forEach((reference) => {
        if (!allReferencedIds.includes(reference.typeId)) {
          record[field].push(reference);
        }
      });
    } else if (isPlainObject(input[field]) && !arrayFieldsArray.includes(field)) {
      // Updating object type fields that are not array
      // Check if it is an additional field
      if (additionalRelationFieldsArray.includes(field)) {
        // Check if relation exists for the additionalfield
        if (record[field].type && record[field].typeId) {
          // merge all additionalFields
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
        // update field type object
        // recordDoc[field] = customMerge(recordDoc[field], input[field], arrayFieldsArray);
        /*
        Above line commented as this is mongoose model and it may require set function to assign a value
         */
        recordDoc.set([field], customMerge(recordDoc[field], input[field], arrayFieldsArray));
      }
    } else if (arrayFieldsArray.includes(field)) {
      // If array type field
      // check and handle additionalField array
      if (additionalRelationFieldsArray.includes(field)) {
        const inputId = input[field].id;
        // Find index by typeId
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
        // Check and handle array field
        recordDoc[field] = handleArrayField(
          record[field],
          input[field],
          arrayFieldsArray,
          nestedDisconnectObjInfo,
          recordDoc.id,
        );
      }
    } else if (!input[field]) {
      /* by setting the empty field value to undefined, mongoose will
      automatically $unset it and the field will be removed
      */
      // For handling case where 0 or false is passed in input
      if (input[field] !== 0 && input[field] !== false) {
        recordDoc[field] = undefined;
      } else {
        recordDoc[field] = input[field];
      }
    } else {
      // replace field value with input
      recordDoc[field] = input[field];
    }
  });
  return recordDoc;
};

// returns if input class with grade and sec already exists
const validateClassItemsUniqueness = (record, input) => {
  if (!input.grade || !input.section) {
    return true;
  }
  const isAExistingClass = find(record, (rec) => {
    const existingClass = { grade: rec.grade, section: rec.section };
    const inputClass = { grade: input.grade, section: input.section };
    return isMatch(existingClass, inputClass);
  });
  return !isAExistingClass;
};

export {
  handleArrayField,
  getUpdatedRecordObject,
  splitOnFirstUnderscore,
  customMerge,
  validateClassItemsUniqueness,
};
