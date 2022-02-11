/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import moment from 'moment';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getSelectedDays from '../../../postHookFunctions/utils/getSelectedDays';
import extractSlotsFromInput from '../../../../../../utils/extractSlotsFromInput';
import getSlotTimeFields from '../../../../../../graphqlSchema/core/functions/getSlotTimeFields';
import getWeekDaysFields from '../../../../../../graphqlSchema/core/functions/getWeekDaysFields';
import { CannotScheduleOutsideWorkingHoursError } from '../../../../../../constants/errors';

const slotTimeFields = getSlotTimeFields('Boolean', true);
const weekDaysFields = getWeekDaysFields('Boolean', true);

const fetchBatch = async (batchId) => {
  const query = `
    query {
      batch(id: "${batchId}"){
        id
        timeTableRule {
          ${slotTimeFields}
          ${weekDaysFields}
          startDate
          endDate
        }
        school {
          timetableSchedule {
            type
            startDate: Date
            endDate: Date
            ${slotTimeFields}
            ${weekDaysFields}
          }
        }
        timetableSchedule {
          type
          startDate: Date
          endDate: Date
          ${slotTimeFields}
          ${weekDaysFields}
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.batch', {});
};

const getCombinedSchedules = (schoolTimetableScheduleArray, batchTimetableScheduleArray) => {
  const combinedWorkingDaySchedule = {};
  const combinedEventScheduleArray = [];
  for (const schoolSchedule of schoolTimetableScheduleArray) {
    const isWorkingDay = get(schoolSchedule, 'type') === 'workingDay';
    if (isWorkingDay) {
      for (const key in Object.keys(schoolSchedule)) {
        if ((key === 'startDate' || key === 'endDate')
        || (key.includes('slot') && schoolSchedule[key])
        || (key.includes('day') && schoolSchedule[key])) {
          combinedWorkingDaySchedule[key] = schoolSchedule[key];
        }
      }
    } else {
      combinedEventScheduleArray.push(schoolSchedule);
    }
  }
  for (const batchSchedule of batchTimetableScheduleArray) {
    const isWorkingDay = get(batchSchedule, 'type') === 'workingDay';
    if (isWorkingDay) {
      for (const key in Object.keys(batchSchedule)) {
        if ((key === 'startDate' && (!combinedWorkingDaySchedule.startDate || moment(new Date(batchSchedule[key])).isBefore(moment(new Date(combinedWorkingDaySchedule.startDate)))))
          || (key === 'endDate' && (!combinedWorkingDaySchedule.startDate || moment(new Date(batchSchedule[key])).isAfter(moment(new Date(combinedWorkingDaySchedule.endDate)))))
          || (key.includes('slot') && batchSchedule[key])
          || (key.includes('day') && batchSchedule[key])) {
          combinedWorkingDaySchedule[key] = batchSchedule[key];
        }
      }
    } else {
      combinedEventScheduleArray.push(schoolSchedule);
    }
  }
  return {
    combinedWorkingDaySchedule,
    combinedEventScheduleArray,
  };
};

// method to check if given schedule will lie outside working hour schedule
const checkIfOutsideWorkingSchedule = (combinedWorkingDaySchedule, combinedEventScheduleArray, days, startDate, endDate, filteredSlots) => {
  // check bounds
  if (moment(startDate).isBefore(moment(combinedWorkingDaySchedule.startDate))
  || moment(endDate).isAfter(moment(combinedWorkingDaySchedule.endDate))) {
    return false;
  }
  // check day and slot RE DO LOGIC
  for (const slot in Object.keys(filteredSlots)) {
    for (const key in Object.keys(combinedWorkingDaySchedule)) {
      // check if same day and not same slot, or different day
      if (key.includes('day') && combinedWorkingDaySchedule[key]
      && ((days.has(key) && slot.includes('slot') && filteredSlots[slot] && !combinedWorkingDaySchedule[slot]) || !days.has[key])) {
        return false;
      }
    }
  }
  // loop over event schedule and check if events fall on input schedule
  for (const schedule of combinedEventScheduleArray) {
    // skip if dates don't intersect
    if (moment(startDate).isAfter(moment(schedule.endDate)) || moment(endDate).isBefore(moment(schedule.endDate))) {
      // eslint-disable-next-line no-continue
      continue;
    }
    // check day and slot RE DO LOGIC
    for (const slot in Object.keys(filteredSlots)) {
      for (const key in Object.keys(schedule)) {
        // check if same day and same slot
        if (key.includes('day') && schedule[key]
          && ((days.has(key) && slot.includes('slot') && filteredSlots[slot] && !schedule[slot]) || !days.has[key])) {
          return false;
        }
      }
    }
  }
  // if passed, return true
  return true;
};

const scheduleSessionsMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  parsedASTMap,
  authentication,
  context,
) => {
  validateAuthentication(context);
  const { input: timeTableRule } = params;
  // start, end dates
  const days = getSelectedDays(timeTableRule);
  // console.log('days', days);

  const startDate = new Date(timeTableRule.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(timeTableRule.endDate);
  endDate.setHours(0, 0, 0, 0);

  // slots passed in input
  const { ...slots } = timeTableRule;
  const { filteredSlots } = extractSlotsFromInput(slots);
  // console.log('filteredSlotsString', filteredSlotsString);

  // Fetch Batch TimetableSchedule and School time table schedule and combine them
  const batch = await fetchBatch(get(timeTableRule, 'batchId', ''));
  const schoolTimetableScheduleArray = get(batch, 'school.timeTableSchedule', []);
  const batchTimetableScheduleArray = get(batch, 'timeTableSchedule', []);

  const { combinedWorkingDaySchedule, combinedEventScheduleArray } = getCombinedSchedules(schoolTimetableScheduleArray, batchTimetableScheduleArray);

  // See if force flag is set to false/or not sent in input
  const forceScheduleSessions = get(timeTableRule, 'forceScheduleSessions', false);
  if (!forceScheduleSessions && combinedWorkingDaySchedule.startDate && combinedWorkingDaySchedule.endDate) {
    const isOutsideWorkingSchedule = checkIfOutsideWorkingSchedule(combinedWorkingDaySchedule, combinedEventScheduleArray, days, startDate, endDate, filteredSlots);
    if (isOutsideWorkingSchedule) {
      throw new CannotScheduleOutsideWorkingHoursError();
    }
  }
  // if force schedule, we can schedule anywhere irrespective of working day or event schedule

  // create sessions, batch / adhoc for all topics possible

  // take care of shifting, in case of clash

  return {
    result: true,
  };
};

export default scheduleSessionsMutationResolver;
