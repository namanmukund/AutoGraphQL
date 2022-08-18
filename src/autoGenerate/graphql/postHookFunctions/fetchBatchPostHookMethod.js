/* eslint-disable no-param-reassign */
import { get } from 'lodash';

// Combine batchStudents into students and also filter out if duplicates
const getStudentsCombinedArray = (input) => [...(input.students || []), ...(input.batchStudents || [])].filter((batch, index, restBatchArray) => (restBatchArray || []).findIndex((restBatch) => (get(restBatch, 'id') === get(batch, 'id'))) === index);

const fetchBatchPostHookMethod = async (input) => {
  if (input && (get(input, 'students', []) || get(input, 'batchStudents', []))) {
    if (Array.isArray(input) && input.length) {
      input.forEach((elem) => {
        elem.students = getStudentsCombinedArray(elem);
      });
    } else {
      input.students = getStudentsCombinedArray(input);
    }
  }
  return input;
};

export default fetchBatchPostHookMethod;
