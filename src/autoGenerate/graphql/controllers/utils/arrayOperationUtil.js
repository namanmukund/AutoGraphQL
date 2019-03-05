import { find, isMatch, omit } from 'lodash';
import { processFilter } from './processFilter';
import { customMerge, validateClassItemsUniqueness } from './utils';
// import MutationController from '../MutationController';
import models from '../../../models';
// Omit _id field for pushToSet check
const omitId = (value) => {
  if (typeof value === 'object') {
    let objectValue;
    try {
      objectValue = value.toJSON();
    } catch (e) {
      objectValue = value;
    }
    return omit(objectValue, ['_id']);
  }
  return value;
};

const removeReferencesWhenDisconnected = (
  dataToBePopped,
  nestedDisconnectObjInfo,
  targetUpdateId,
) => {
  if (dataToBePopped && dataToBePopped.length) {
    dataToBePopped.forEach((data) => {
      Object.keys(data).forEach((key) => {
        if (Object.keys(nestedDisconnectObjInfo).includes(key)) {
          // initialize data
          const tempDisconnectObj = nestedDisconnectObjInfo[key];
          if (!nestedDisconnectObjInfo[key].data) {
            Object.assign(nestedDisconnectObjInfo, {
              [key]: {
                data: [],
              },
            });
          }
          // collect all ids of same type
          Object.assign(nestedDisconnectObjInfo, {
            [key]: {
              ...tempDisconnectObj,

              data: Array.isArray(data[key]) ?
                [...nestedDisconnectObjInfo[key].data, ...data[key]] :
                [...nestedDisconnectObjInfo[key].data, data[key]],
            },
          });
        }
      });
    });
  }
  /*
question:{ relationName: 'QuestionQuizDump',
  nestedFieldName: 'question',
  nestedDataType: 'QuizAttemptedQuestion',
  typeName: 'UserActivityDump',
  relatedDataType: 'QuestionBank',
  removeOperationType: 'pop',
  relatedFieldName: 'fromQuizInDump',
  isRelatedFieldAList: true,
  data:
   [ { _id: 5c7ef22f3ffc36e02c18bc6a,
       typeId: 'cjrthr04t001j1ht9n75x6hdk',
       type: 'QuestionBank' } ] }
 */
  //
  const promiseArray = [];
  Object.keys(nestedDisconnectObjInfo).forEach((nestedField) => {
    const { data, relatedFieldName, relatedDataType, isRelatedFieldAList } = nestedField;
    const idToBePulled = data.map(doc => doc.typeId);
    const searchObj = {
      id: {
        $in: idToBePulled,
      },
    };
    let updateObject = {};
    if (isRelatedFieldAList) {
      updateObject = {
        $pull: {
          [relatedFieldName]: { typeId: targetUpdateId },
        },
      };
    } else {
      updateObject = {
        $set: {
          [relatedFieldName]: {},
        },
      };
    }
    // const modelMutations = new MutationController(relatedDataType, { bypass: true });
    promiseArray.push(models[relatedDataType].update(searchObj, updateObject));
  });

  return Promise.all(promiseArray);
};

// All array operations
const arrayOperationFunctions = {
  // Push single element to array
  push(record = [], input) {
    return [...record, input];
  },
  // Push multiple elements to array
  pushMany(record = [], input) {
    return [...record, ...input];
  },
  // Push element if its not there
  pushToSet(record = [], input) {
    // added validation to make sure same class, sec is not added
    const isANewClassItem = validateClassItemsUniqueness(record, input);
    if (find(record, rec => isMatch(omitId(rec), input)) === undefined && isANewClassItem) {
      return [...record, input];
    }
    return record;
  },
  // Replace array altogether
  replace(record, input) {
    return input;
  },
  // Find and update an element in array
  update(record, inputWhere, inputWith, arrayFieldsArray) {
    if (record === null) {
      return record;
    }
    const type = typeof inputWith;
    return record.map((rec) => {
      const isAMatch = processFilter(rec, inputWhere);
      if (isAMatch) {
        if (type === 'object') {
          return customMerge(rec, inputWith, arrayFieldsArray);
        }
        return inputWith;
      }
      return rec;
    });
  },
  // Update all elements of array
  updateAll(record, input, arrayFieldsArray) {
    if (record === null) {
      return record;
    }
    const type = typeof input;
    return record.map((rec) => {
      if (type === 'object') {
        return customMerge(rec, input, arrayFieldsArray);
      }
      return input;
    });
  },
  // Delete 1st element from array
  popFront(
    record,
    input,
    arrayFieldsArray,
    nestedDisconnectObjInfo,
    targetUpdateId,
  ) {
    if (record === null || input === false) {
      return record;
    }
    const dataToBePopped = record.map(d => d.toObject())[0];
    removeReferencesWhenDisconnected(
      dataToBePopped,
      nestedDisconnectObjInfo,
      targetUpdateId,
    );
    return record.slice(1);
  },
  // Delete last element from array
  popBack(
    record,
    input,
    arrayFieldsArray,
    nestedDisconnectObjInfo,
    targetUpdateId,
  ) {
    if (record === null || input === false) {
      return record;
    }
    const dataToBePopped = record.map(d => d.toObject())[record.length - 1];
    removeReferencesWhenDisconnected(
      dataToBePopped,
      nestedDisconnectObjInfo,
      targetUpdateId,
    );
    return record.slice(0, record.length - 1);
  },
  // Delete all elements of array
  popAll(
    record,
    input,
    arrayFieldsArray,
    nestedDisconnectObjInfo,
    targetUpdateId,
  ) {
    if (record === null || input === false) {
      return record;
    }
    const dataToBePopped = record.map(d => d.toObject());
    removeReferencesWhenDisconnected(
      dataToBePopped,
      nestedDisconnectObjInfo,
      targetUpdateId,
    );
    return [];
  },
  // Find and delete elements of array
  pop(
    record,
    input,
    arrayFieldsArray,
    nestedDisconnectObjInfo,
    targetUpdateId,
  ) {
    if (record === null) {
      return record;
    }
    const dataToBePopped = record.filter(rec => processFilter(rec, input)).map(d => d.toObject());
    removeReferencesWhenDisconnected(
      dataToBePopped,
      nestedDisconnectObjInfo,
      targetUpdateId,
    );
    return record.filter(rec => !processFilter(rec, input));
  },
};

export default arrayOperationFunctions;
