import { get } from 'lodash';
import { MAX_ALLOWED_BATCH_SESSIONS_DAYS_RANGE, slotTimes, weekDays } from '../../../../../constants';
import { MaxAllowedDayRangeExceededError, StartEndDateError } from '../../../../../constants/errors';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import { NoSlotSelectedError, OnlyOneSlotAllowedError } from '../../../../../constants/errors/input';

/* eslint-disable no-unused-vars */
const updateBatchValidation = async (params, mutationName, context) => {
  const timeTableRule = get(params, 'input.timeTableRule', null);
  if (timeTableRule) {
    const startDate = new Date(timeTableRule.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(timeTableRule.endDate);
    endDate.setHours(0, 0, 0, 0);
    // throw error in this case
    if (startDate > endDate) {
      throw new StartEndDateError();
    }
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > MAX_ALLOWED_BATCH_SESSIONS_DAYS_RANGE) {
      throw new MaxAllowedDayRangeExceededError();
    }

    const { ...slots } = timeTableRule;
    const slotTimeArray = getSelectedSlotsTime(slots);

    if (!slotTimeArray.length) {
      throw new NoSlotSelectedError();
    } else if (slotTimeArray.length > 1) {
      throw new OnlyOneSlotAllowedError();
    }

    // only slot whih is passed in input will be true
    slotTimes.forEach((time) => {
      if (`slot${slotTimeArray[0]}` === time) {
        // eslint-disable-next-line no-param-reassign
        params.input.timeTableRule[time] = true;
      } else {
        // eslint-disable-next-line no-param-reassign
        params.input.timeTableRule[time] = false;
      }
    });

    // update other days to false which are not passed as true in input
    weekDays.forEach((day) => {
      // eslint-disable-next-line no-param-reassign
      params.input.timeTableRule[day] = get(params, `input.timeTableRule.${day}`, false);
    });
  }
};

export default updateBatchValidation;
