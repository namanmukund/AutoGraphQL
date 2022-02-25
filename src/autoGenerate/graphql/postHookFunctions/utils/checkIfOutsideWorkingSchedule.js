/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import moment from 'moment';
import { weekDays, slotTimes } from '../../../../../constants';

// method to check if given schedule will lie outside working hour schedule
const checkIfOutsideWorkingSchedule = (combinedWorkingDaySchedule, combinedEventScheduleArray, timeTableRule, daysRule) => {
  // checking if days are within bounds
  if (moment(timeTableRule.startDate).isBefore(moment(combinedWorkingDaySchedule.startDate))
    || moment(timeTableRule.endDate).isAfter(moment(combinedWorkingDaySchedule.endDate))) {
    return true;
  }
  // checking if weekdays or nonRecurringslots are outside scheduled working hours
  for (const weekDay of weekDays) {
    if (!combinedWorkingDaySchedule[weekDay] && daysRule[weekDay]) {
      return true;
    }
  }
  for (const slotTime of slotTimes) {
    if (!combinedWorkingDaySchedule[slotTime]) {
      for (const day in daysRule) {
        for (const rule in daysRule[day]) {
          if (rule[slotTime]) {
            return true;
          }
        }
      }
    }
  }
  // for events, we check return true if events schedule exactly matches (opposite logic for working day)
  for (const combinedEventScheduleItem of combinedEventScheduleArray) {
    for (const weekDay of weekDays) {
      if (combinedEventScheduleItem[weekDay] && daysRule[weekDay]) {
        const dayObj = daysRule[weekDay];
        for (const slotTime of slotTimes) {
          if (combinedEventScheduleItem[slotTime] && dayObj[slotTime]) {
            return true;
          }
        }
      }
    }
  }
  // if inside working schedule
  return false;
};

export default checkIfOutsideWorkingSchedule;
