/* eslint-disable no-restricted-syntax */
import moment from 'moment';
import { get } from 'lodash';

// combines the working day and event schedules
const getCombinedSchedules = (batch) => {
  const schoolTimetableScheduleArray = get(batch, 'school.timetableSchedule', []);
  const batchTimetableScheduleArray = get(batch, 'timetableSchedule', []);
  const combinedWorkingDaySchedule = {};
  const combinedEventScheduleArray = [];

  for (const schoolSchedule of schoolTimetableScheduleArray) {
    const isWorkingDay = get(schoolSchedule, 'type') === 'workingDay';
    if (isWorkingDay) {
      for (const key in schoolSchedule) {
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
      for (const key in batchSchedule) {
        if ((key === 'startDate' && (!combinedWorkingDaySchedule.startDate || moment(new Date(batchSchedule[key])).isBefore(moment(new Date(combinedWorkingDaySchedule.startDate)))))
          || (key === 'endDate' && (!combinedWorkingDaySchedule.startDate || moment(new Date(batchSchedule[key])).isAfter(moment(new Date(combinedWorkingDaySchedule.endDate)))))
          || (key.includes('slot') && batchSchedule[key])
          || (key.includes('day') && batchSchedule[key])) {
          combinedWorkingDaySchedule[key] = batchSchedule[key];
        }
      }
    } else {
      combinedEventScheduleArray.push(batchSchedule);
    }
  }
  return {
    combinedWorkingDaySchedule,
    combinedEventScheduleArray,
  };
};

export default getCombinedSchedules;
