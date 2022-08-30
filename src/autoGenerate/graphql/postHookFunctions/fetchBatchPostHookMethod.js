/* eslint-disable no-param-reassign */
import getStudentsCombinedArray from '../../../../utils/getStudentsCombinedArray';

const fetchBatchPostHookMethod = async (input) => {
  if (input) {
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
