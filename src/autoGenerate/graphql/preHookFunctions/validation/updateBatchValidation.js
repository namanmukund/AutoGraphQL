import { MAX_ALLOWED_BATCH_SESSIONS_DAYS_RANGE } from '../../../../../constants';
import { MaxAllowedDayRangeExceededError } from '../../../../../constants/errors';

/* eslint-disable no-unused-vars */
const updateBatchValidation = async (params, mutationName, context) => {
  const {
    input: {
      timeTableRule,
    },
  } = params;
  if (timeTableRule) {
    const startDate = new Date(timeTableRule.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(timeTableRule.endDate);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > MAX_ALLOWED_BATCH_SESSIONS_DAYS_RANGE) {
      throw new MaxAllowedDayRangeExceededError();
    }
  }
};

export default updateBatchValidation;
