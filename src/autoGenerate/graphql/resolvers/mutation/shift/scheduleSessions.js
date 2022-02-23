/* eslint-disable no-lonely-if */
/* eslint-disable no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import moment from 'moment';
import { log } from '../../../../../../utils/log';
// import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getSelectedDays from '../../../postHookFunctions/utils/getSelectedDays';
import extractSlotsFromInput from '../../../../../../utils/extractSlotsFromInput';
import {
  CannotScheduleOutsideWorkingHoursError,
  SlotsOccupiedError,
  InvalidScheduleParameters,
  InvalidRescheduleParameters,
  DatabaseRecordNotFoundError,
} from '../../../../../../constants/errors';
import getPossibleDates from '../../../../../../utils/getPossibleDates';
import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import { weekDays, slotTimes } from '../../../../../../constants';
import {
  getTopics, getBatchSessions, createBatchSession, updateBatchSession,
  createAdhocSession, getAdhocSessions, updateAdhocSession,
} from '../../../postHookFunctions/utils/updateBatchPostHookQueries';
import {
  fetchBatch,
  fetchMentorSessions,
  updateMentorSession,
  addMentorSession,
  shiftBatchSessionsAfterGivenDate,
  fetchBatchSession,
  fetchAdhocSession,
} from './queries/scheduleSessionsQueries';

// schedule sessions groupBy day (like Object.day.field)
const getScheduleSessionsRulesGroupedByDay = (scheduleSessionsRules) => {
  const daysRule = {};
  scheduleSessionsRules.forEach((rule) => {
    // loop through keys in rule
    for (const key in rule) {
      if (key.includes('day') && !key.includes('ClassMode') && key) {
        if (!daysRule[key]) {
          daysRule[key] = {};
        }
        // loop through same keys in rule and store the nonRecurringslots, mode, start and end times
        for (const key2 in rule) {
          if ((key2.includes('slot') && key2)
            || (key2 === `${key}ClassMode`)
            || (key2 === 'startTime' || key2 === 'endTime')) {
            daysRule[key][key2] = key2.includes('slot') ? true : rule[key2];
          }
        }
      }
    }
  });
  return daysRule;
};

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

// method to sort batchSessions
const sortBatchSessions = (batchSessions) => {
  const sessionsStartedOrCompleted = [];
  const sessionsAllotted = [];

  batchSessions.map((item) => {
    /* eslint-disable array-callback-return */
    if (item.sessionStatus === 'allotted') {
      sessionsAllotted.push(item);
    } else {
      sessionsStartedOrCompleted.push(item);
    }
  });

  return { sessionsStartedOrCompleted, sessionsAllotted };
};

// get mentor session if after updating / adding mentor session
const getMentorSessionId = async (allottedMentorId, date, slotsInInput, courseId, sessionType) => {
  let finalMentorSessionId = '';
  if (allottedMentorId) {
    const sentSlotsArray = getSelectedSlotsTime(slotsInInput);
    // eslint-disable-next-line no-await-in-loop
    const mentorSessionsRes = await callLocalGraphqlApi(fetchMentorSessions(date, allottedMentorId, sessionType));
    const mentorSession = get(mentorSessionsRes, 'data.mentorSessions[0]');
    if (mentorSession && mentorSession.id) {
      const { id: mentorSessionId, ...slotsInMentorSession } = mentorSession;
      finalMentorSessionId = mentorSessionId;
      const slotsInMentorSessionArray = getSelectedSlotsTime(slotsInMentorSession);
      if (sentSlotsArray && sentSlotsArray.length && slotsInMentorSessionArray && slotsInMentorSessionArray.length && sentSlotsArray[0] !== slotsInMentorSessionArray[0]) {
        // eslint-disable-next-line no-await-in-loop
        await callLocalGraphqlApi(updateMentorSession(mentorSessionId, date, `slot${sentSlotsArray[0]}`));
      }
    } else {
      // eslint-disable-next-line no-await-in-loop
      const addMentorSessionRes = await callLocalGraphqlApi(addMentorSession(allottedMentorId, courseId, date, `slot${sentSlotsArray[0]}`, sessionType));
      finalMentorSessionId = get(addMentorSessionRes, 'data.addMentorSession.id');
    }
  }
  return finalMentorSessionId;
};

// create batch sessions according to remaining topics and required number of sessions
const createBatchSessions = async (batchId, possibleDates, filteredSlots, slotsInInput, possibleSessionCount, topics, allottedMentorId, courseId, batchType) => {
  if (possibleDates.length <= possibleSessionCount) {
    // eslint-disable-next-line no-restricted-syntax
    for (const date of possibleDates) {
      const index = possibleDates.indexOf(date);
      const topicOrder = topics[index].order;
      let sessionType = 'batch';

      if (batchType === 'b2b2c' && topicOrder === 1) {
        sessionType = 'trial';
      }

      // eslint-disable-next-line no-await-in-loop
      const finalMentorSessionId = await getMentorSessionId(allottedMentorId, date, slotsInInput, courseId, sessionType);
      createBatchSession(batchId, date, filteredSlots, topics[index].id, finalMentorSessionId, courseId);
    }
  } else {
    for (let i = 0; i < possibleSessionCount; i += 1) {
      const topicOrder = topics[i].order;
      let sessionType = 'batch';

      if (batchType === 'b2b2c' && topicOrder === 1) {
        sessionType = 'trial';
      }

      // eslint-disable-next-line no-await-in-loop
      const finalMentorSessionId = await getMentorSessionId(allottedMentorId, possibleDates[i], slotsInInput, courseId, sessionType);
      createBatchSession(batchId, possibleDates[i].toISOString(), filteredSlots, topics[i].id, finalMentorSessionId, courseId);
    }
  }
  return true;
};

// update existing batch sessions with topic id
const updateAllottedBatchSessions = async (sessionsAllotted, possibleDates, allottedMentorId, courseId, batchType) => {
  let i = 0;
  /* eslint-disable array-callback-return */
  // eslint-disable-next-line no-restricted-syntax
  for (const session of sessionsAllotted) {
    const topicOrder = get(session, 'topic.order', -1);
    let sessionType = 'batch';

    if (batchType === 'b2b2c' && topicOrder === 1) {
      sessionType = 'trial';
    }

    const slotObj = {};
    slotObj[possibleDates[i].slot] = true;
    // eslint-disable-next-line no-await-in-loop
    const finalMentorSessionId = await getMentorSessionId(allottedMentorId, possibleDates[i].date, slotObj, courseId, sessionType);

    /* eslint-disable array-callback-return */
    const date = possibleDates[i].date.toISOString();
    updateBatchSession(session.id, `${possibleDates[i].slot}: true`, date, finalMentorSessionId, courseId);
    i += 1;
  }
};

// check if sessions already exist at provided date and slot
const sessionExistsCheck = async (rescheduleSlots, batchId, startDate) => {
  const sentSlotsArray = getSelectedSlotsTime(rescheduleSlots);
  const batchSessionsOnSameDateAndSlot = await getBatchSessions(batchId, startDate, sentSlotsArray[0], 'allotted');
  const adhocSessionsOnSameDateAndSlot = await getAdhocSessions(batchId, startDate, sentSlotsArray[0], 'allotted');
  if (batchSessionsOnSameDateAndSlot.length > 0 || adhocSessionsOnSameDateAndSlot.length > 0) {
    return true;
  }
  return false;
};

// get possible date objects with corresponding slots inside
const getPossileDatesFromRule = async (startDate, endDate, daysRule) => {
  const days = getSelectedDays(daysRule);
  const dayMapping = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  // here days is Set which hold the integer values of days of the week (0-6), for better lookup
  const dates = [];
  let currentDate = startDate;
  /* eslint-disable func-names */
  const addDays = function (daysToAdd) {
    const date = new Date(this.valueOf());
    date.setDate(date.getDate() + daysToAdd);
    return date;
  };

  while (currentDate <= endDate) {
    if (days.has(currentDate.getDay())) {
      const dateObj = {};
      dateObj.date = currentDate;
      for (const key in daysRule[dayMapping[currentDate.getDay()]]) {
        if (key.includes('slot') && key) {
          dateObj.slot = key;
          break;
        }
      }
      dates.push(dateObj);
    }
    currentDate = addDays.call(currentDate, 1);
  }
  return dates;
};

/**
 * @description This method is used to schedule batch or adhoc sessions, recurring or non recurring
 * NON RECURRING BATCH OR ADHOC SESSION
 * @input { courseId, batchId, topicId, sessionMode, startDate, startTime, endTime }
 * @summary used to schedule single batch or adhoc session on given startDate
 * -> endDate is not considered, defaults to an hour slot, taken from startTime
 * -> In case outside working hours, error thrown (can be bypassed by forceScheduleSessions = true)
 * -> in case of clash, forceShiftSessions flag can be used, which shifts the already assigned sessions by one.
 * RECURRING BATCH SESSIONS
 * @input { courseId, batchId, sessionModes corresponding to every day, startDate, endDate, startTime, endTime }
 * @summary used to schedule recurring batch sessions (no support for adhoc sessions as yet)
 * -> endDate is mandatory in this case
 * -> in case outside working hours, error thrown (can be bypassed by forceScheduleSessions = true)
 * -> logic is to delete all existing started / completed sessions and start
 * clashes priority (test, adhoc, normal)
 * -> will be rescheduled to next sessions as per timetableRule
 */

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
  // validateAuthentication(context);
  const { input: timeTableRule } = params;
  const scheduleSessionsRules = get(timeTableRule, 'scheduleSessionsRules', []);
  const courseId = get(timeTableRule, 'courseId');
  const topicId = get(timeTableRule, 'topicId');
  const isRecurring = get(timeTableRule, 'isRecurring');
  const doReschedule = get(timeTableRule, 'doReschedule', false);
  const batchSessionId = get(timeTableRule, 'batchSessionId', '');
  const adhocSessionId = get(timeTableRule, 'adhocSessionId', '');
  const forceShiftSessions = get(timeTableRule, 'forceShiftSessions', false);
  const sessionType = get(timeTableRule, 'type', 'batch');

  let batch = null;
  if (!doReschedule) {
    batch = await fetchBatch(get(timeTableRule, 'batchId', ''));
  } else if (batchSessionId) {
    batch = get(await fetchBatchSession(batchSessionId), 'batch', null);
  } else {
    batch = get(await fetchAdhocSession(adhocSessionId), 'batch', null);
  }

  const batchId = get(batch, 'id');

  if (!batchId) {
    throw new DatabaseRecordNotFoundError();
  }
  const mentorUserId = get(batch, 'allottedMentor.id', '');
  const batchType = get(batch, 'type');

  const startDate = new Date(timeTableRule.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(timeTableRule.endDate);
  endDate.setHours(0, 0, 0, 0);

  // nonRecurringslots passed in input (non-recurring)
  // for non recurring cases, we only consider first object in array as input
  const { ...nonRecurringslots } = get(scheduleSessionsRules, '[0]', {});
  const { filteredSlotsString: nonRecurringfilteredSlotsString } = extractSlotsFromInput(nonRecurringslots);

  // to reschedule sessions
  if (doReschedule) {
    if (!adhocSessionId && !batchSessionId) {
      throw new InvalidRescheduleParameters();
    } else if (adhocSessionId && batchSessionId) {
      throw new InvalidRescheduleParameters();
    } else {
      // check if sessions already exist at provided date and slot and have to reschedule batch session
      const sessionsExist = await sessionExistsCheck(rescheduleSlots, batchId, startDate);
      if (sessionsExist && batchSessionId) {
        throw new SlotsOccupiedError();
      }
      // TODO : change logic to reschedule all sessions based on new timetable rules in array format
      if (forceShiftSessions) {
        log(`Shifting batch sessions before ${startDate.toISOString()} to after ${startDate.toISOString()}`);
        // callLocalGraphqlApi(shiftBatchSessionsAfterGivenDate(startDate, batchId, rescheduleSlots));
      }
      if (adhocSessionId) {
        await updateAdhocSession(adhocSessionId, nonRecurringfilteredSlotsString, startDate);
      } else {
        await updateBatchSession(batchSessionId, nonRecurringfilteredSlotsString, startDate);
      }
    }
    return {
      result: true,
    };
  }

  if (scheduleSessionsRules.length === 0
    || (scheduleSessionsRules.length > 1 && !isRecurring)) {
    throw new InvalidScheduleParameters();
  }

  const daysRule = getScheduleSessionsRulesGroupedByDay(scheduleSessionsRules);
  const days = getSelectedDays(daysRule);

  // combine school and batch timetableschedules
  const { combinedWorkingDaySchedule, combinedEventScheduleArray } = getCombinedSchedules(batch);

  // See if force flag is set to false or not sent in input
  const forceScheduleSessions = get(timeTableRule, 'forceScheduleSessions', false);

  if (!forceScheduleSessions && combinedWorkingDaySchedule.startDate) {
    const isOutsideWorkingSchedule = checkIfOutsideWorkingSchedule(combinedWorkingDaySchedule, combinedEventScheduleArray, timeTableRule, daysRule);
    if (isOutsideWorkingSchedule) {
      throw new CannotScheduleOutsideWorkingHoursError();
    }
  }

  // if force schedule, we can schedule anywhere irrespective of working day or event schedule
  if (sessionType === 'batch') {
    let topics = await getTopics(courseId);
    const topicCount = topics && topics.length;
    const batchSessions = await getBatchSessions(batchId);

    // check if sessions already exist at provided date and slot
    const sessionsExist = await sessionExistsCheck(nonRecurringslots, batchId, startDate);
    if (sessionsExist) {
      if (!forceScheduleSessions) {
        throw new SlotsOccupiedError();
      } else {
        // TODO : schedule sessions by replacing existing sessions
      }
    }

    // if not recurring schedule, create singular batch session
    if (!isRecurring) {
      const finalMentorSessionId = await getMentorSessionId(mentorUserId, startDate, nonRecurringfilteredSlotsString, courseId, sessionType);
      if (!(batchId && startDate && nonRecurringfilteredSlotsString && topicId && finalMentorSessionId && courseId)) {
        throw new InvalidScheduleParameters();
      }
      createBatchSession(batchId, startDate, nonRecurringfilteredSlotsString, topicId, finalMentorSessionId, courseId);
    } else if (timeTableRule) {
      if (batchSessions && batchSessions.length) {
        // sorting the existing batch sessions into started/completed and allotted
        const {
          sessionsStartedOrCompleted,
          sessionsAllotted,
        } = sortBatchSessions(batchSessions);
        let possibleSessionCount = topicCount;
        if (sessionsStartedOrCompleted.length > 0) {
          // if there exists some started or completed sessions, don't count them, create/update sessions for the remaining
          possibleSessionCount -= sessionsStartedOrCompleted.length;
        }

        // let possibleDates = getPossibleDates(startDate, endDate, days);
        let possibleDates = await getPossileDatesFromRule(startDate, endDate, daysRule);

        // for the sessions which are still in the allotted state, update them
        const allottedSessionsCount = sessionsAllotted.length;
        if (allottedSessionsCount > 0) {
          possibleSessionCount -= allottedSessionsCount;
          updateAllottedBatchSessions(sessionsAllotted, possibleDates, mentorUserId, courseId, batchType);
        }
        if (possibleSessionCount > 0) {
          // all the remaining sessions have to be created
          const startFromIndex = allottedSessionsCount;
          possibleDates = possibleDates.slice(startFromIndex);
          const topicStartIndex = topicCount - possibleSessionCount;
          topics = topics.splice(topicStartIndex);
          createBatchSessions(batchId, possibleDates, nonRecurringfilteredSlotsString, nonRecurringslots, possibleSessionCount, topics, mentorUserId, courseId, batchType);
        }
      } else {
        // if there are no exisiting batchSessions for the given batch id, create all of them
        const possibleSessionCount = topicCount;
        const possibleDates = getPossibleDates(startDate, endDate, days);
        createBatchSessions(batchId, possibleDates, nonRecurringfilteredSlotsString, nonRecurringslots, possibleSessionCount, topics, mentorUserId, courseId, batchType);
      }
    }
  } else {
    // if adhoc and recurring, throw error
    if (isRecurring) {
      throw new InvalidScheduleParameters();
    }
    const finalMentorSessionId = await getMentorSessionId(mentorUserId, startDate, nonRecurringfilteredSlotsString, courseId, sessionType);
    createAdhocSession(batchId, startDate, nonRecurringfilteredSlotsString, topicId, finalMentorSessionId, courseId);
  }
  return {
    result: true,
  };
};

export default scheduleSessionsMutationResolver;
