/* eslint-disable no-continue */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import moment from 'moment';
import { weekDays, slotTimes } from '../../../../../constants';

// method to check if given schedule will lie outside working hour schedule
const checkIfOutsideWorkingSchedule = (combinedWorkingDaySchedule, combinedEventScheduleArray, timeTableRule, daysRule) => {
  // checking if days are within bounds
  if (!(moment(timeTableRule.startDate).isSameOrAfter(moment(combinedWorkingDaySchedule.startDate))
    && moment(timeTableRule.endDate).isSameOrBefore(moment(combinedWorkingDaySchedule.endDate)))) {
    return { isOutsideWorkingSchedule: true, errorMessage: 'Given range does not lie within scheduled working hours.' };
  }
  // checking if weekdays or nonRecurringslots are outside scheduled working hours
  for (const weekDay of weekDays) {
    if (!combinedWorkingDaySchedule[weekDay] && daysRule[weekDay]) {
      return { isOutsideWorkingSchedule: true, errorMessage: 'Given week day not in scheduled working hours.' };
    }
  }
  for (const slotTime of slotTimes) {
    if (!combinedWorkingDaySchedule[slotTime]) {
      for (const day in daysRule) {
        for (const rule in daysRule[day]) {
          if (rule[slotTime]) {
            return {
              isOutsideWorkingSchedule: true, errorMessage: 'Given time slots not in scheduled working hours.',
            };
          }
        }
      }
    }
  }
  // for events, we check return true if events schedule exactly matches (opposite logic for working day)
  for (const combinedEventScheduleItem of combinedEventScheduleArray) {
    if (moment(timeTableRule.endDate).isBefore(moment(combinedEventScheduleItem.startDate))
      || moment(timeTableRule.startDate).isAfter(moment(combinedEventScheduleItem.endDate))) {
      continue;
    }
    for (const weekDay of weekDays) {
      if (combinedEventScheduleItem[weekDay] && daysRule[weekDay]) {
        const dayObj = daysRule[weekDay];
        for (const slotTime of slotTimes) {
          if (combinedEventScheduleItem[slotTime] && dayObj[slotTime]) {
            return { isOutsideWorkingSchedule: true, errorMessage: 'Event Scheduled at the same time.' };
          }
        }
      }
    }
  }
  // if inside working schedule
  return { isOutsideWorkingSchedule: false, errorMessage: '' };
};

export default checkIfOutsideWorkingSchedule;
