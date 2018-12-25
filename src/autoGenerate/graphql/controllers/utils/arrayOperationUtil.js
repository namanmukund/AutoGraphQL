import { find, isMatch, omit } from 'lodash';
import { processFilter } from './processFilter';
import { customMerge, validateClassItemsUniqueness } from './utils';
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
  popFront(record, input) {
    if (record === null || input === false) {
      return record;
    }
    return record.slice(1);
  },
  // Delete last element from array
  popBack(record, input) {
    if (record === null || input === false) {
      return record;
    }
    return record.slice(0, record.length - 1);
  },
  // Delete all elements of array
  popAll(record, input) {
    if (record === null || input === false) {
      return record;
    }
    return [];
  },
  // Find and delete elements of array
  pop(record, input) {
    if (record === null) {
      return record;
    }
    return record.filter(rec => !processFilter(rec, input));
  },
};

export default arrayOperationFunctions;
