/* eslint-disable no-param-reassign */
import { get } from 'lodash';
import getStudentsCombinedArray from '../../../../utils/getStudentsCombinedArray';

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
