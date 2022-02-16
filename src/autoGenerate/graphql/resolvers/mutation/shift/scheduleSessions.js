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
import { CannotScheduleOutsideWorkingHoursError, SlotsOccupiedError } from '../../../../../../constants/errors';
import getPossibleDates from '../../../../../../utils/getPossibleDates';
import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import { weekDays, slotTimes } from '../../../../../../constants';
import {
  getTopics, getBatchSessions, createBatchSession, updateBatchSession,
  createAdhocSession, getAdhocSessions,
} from '../../../postHookFunctions/utils/updateBatchPostHookQueries';
import {
  fetchBatch,
  fetchMentorSessions,
  updateMentorSession,
  addMentorSession,
  shiftBatchSessionsAfterGivenDate,
} from './queries/scheduleSessionsQueries';

// combines the working day and event schedules
const getCombinedSchedules = (schoolTimetableScheduleArray, batchTimetableScheduleArray) => {
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
      combinedEventScheduleArray.push(schoolSchedule);
    }
  }
  return {
    combinedWorkingDaySchedule,
    combinedEventScheduleArray,
  };
};

// method to check if given schedule will lie outside working hour schedule
const checkIfOutsideWorkingSchedule = (combinedWorkingDaySchedule, combinedEventScheduleArray, timeTableRule) => {
  // checking if days are within bounds
  if (moment(timeTableRule.startDate).isBefore(moment(combinedWorkingDaySchedule.startDate))
    || moment(timeTableRule.endDate).isAfter(moment(combinedWorkingDaySchedule.endDate))) {
    return true;
  }
  // checking if weekdays or slots are outside scheduled working hours
  for (const weekDay in weekDays) {
    if (!combinedWorkingDaySchedule[weekDay] && timeTableRule[weekDay]) {
      return true;
    }
  }
  for (const slotTime in slotTimes) {
    if (!combinedWorkingDaySchedule[slotTime] && timeTableRule[slotTime]) {
      return true;
    }
  }
  // for events, we check return true if events schedule exactly matches (opposite logic for working day)
  for (const combinedEventScheduleItem in combinedEventScheduleArray) {
    for (const weekDay in weekDays) {
      if (combinedEventScheduleItem[weekDay] && timeTableRule[weekDay]) {
        for (const slotTime in slotTimes) {
          if (combinedEventScheduleItem[slotTime] && timeTableRule[slotTime]) {
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
const updateAllottedBatchSessions = async (sessionsAllotted, possibleDates, filteredSlotsString, slotsInInput, allottedMentorId, courseId, batchType) => {
  let i = 0;
  /* eslint-disable array-callback-return */
  // eslint-disable-next-line no-restricted-syntax
  for (const session of sessionsAllotted) {
    const topicOrder = get(session, 'topic.order', -1);
    let sessionType = 'batch';

    if (batchType === 'b2b2c' && topicOrder === 1) {
      sessionType = 'trial';
    }

    // eslint-disable-next-line no-await-in-loop
    const finalMentorSessionId = await getMentorSessionId(allottedMentorId, possibleDates[i], slotsInInput, courseId, sessionType);
    /* eslint-disable array-callback-return */
    const date = possibleDates[i].toISOString();
    updateBatchSession(session.id, filteredSlotsString, date, finalMentorSessionId, courseId);
    i += 1;
  }
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
  // validateAuthentication(context);
  const { input: timeTableRule } = params;
  const courseId = get(timeTableRule, 'courseId');
  const topicId = get(timeTableRule, 'topicId');
  const batchId = get(timeTableRule, 'batchId');
  const isRecurring = get(timeTableRule, 'isRecurring');

  // start, end dates
  const days = getSelectedDays(timeTableRule);
  const startDate = new Date(timeTableRule.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(timeTableRule.endDate);
  endDate.setHours(0, 0, 0, 0);

  // slots passed in input
  const { ...slots } = timeTableRule;
  const { filteredSlotsString } = extractSlotsFromInput(slots);

  // combine school and batch timetableschedules
  const batch = await fetchBatch(get(timeTableRule, 'batchId', ''));
  const schoolTimetableScheduleArray = get(batch, 'school.timetableSchedule', []);
  const batchTimetableScheduleArray = get(batch, 'timetableSchedule', []);
  const mentorUserId = get(batch, 'allottedMentor.id', '');
  const batchType = get(batch, 'type');

  const { combinedWorkingDaySchedule, combinedEventScheduleArray } = getCombinedSchedules(schoolTimetableScheduleArray, batchTimetableScheduleArray);

  // See if force flag is set to false or not sent in input
  const forceScheduleSessions = get(timeTableRule, 'forceScheduleSessions', false);

  if (!forceScheduleSessions && combinedWorkingDaySchedule.startDate && combinedWorkingDaySchedule.endDate) {
    const isOutsideWorkingSchedule = checkIfOutsideWorkingSchedule(combinedWorkingDaySchedule, combinedEventScheduleArray, timeTableRule);
    if (isOutsideWorkingSchedule) {
      throw new CannotScheduleOutsideWorkingHoursError();
    }
  }

  // if force schedule, we can schedule anywhere irrespective of working day or event schedule
  const sessionType = get(timeTableRule, 'type', 'batch');
  if (sessionType === 'batch') {
    let topics = await getTopics(courseId);
    const topicCount = topics && topics.length;
    const batchSessions = await getBatchSessions(batchId);

    // checking if sessions are present on the same date
    const sentSlotsArray = getSelectedSlotsTime(slots);
    const batchSessionsOnSameDateAndSlot = await getBatchSessions(batchId, startDate, sentSlotsArray[0], 'allotted');
    const adhocSessionsOnSameDateAndSlot = await getAdhocSessions(batchId, startDate, sentSlotsArray[0], 'allotted');
    if (batchSessionsOnSameDateAndSlot.length > 0 || adhocSessionsOnSameDateAndSlot.length > 0) {
      if (!forceScheduleSessions) {
        throw new SlotsOccupiedError();
      } else {
        // ENHANCEMENT : handle the case where only future slots from given date should be shifted, not allotted slots in the past
        await callLocalGraphqlApi(shiftBatchSessionsAfterGivenDate(startDate, batchId, filteredSlotsString));
      }
    }

    // if not recurring schedule
    if (!isRecurring) {
      const finalMentorSessionId = await getMentorSessionId(mentorUserId, startDate, filteredSlotsString, courseId, sessionType);
      createBatchSession(batchId, startDate, filteredSlotsString, topicId, finalMentorSessionId, courseId);
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
        let possibleDates = getPossibleDates(startDate, endDate, days);
        // for the sessions which are still in the allotted state, update them
        const allottedSessionsCount = sessionsAllotted.length;
        if (allottedSessionsCount > 0) {
          possibleSessionCount -= allottedSessionsCount;
          updateAllottedBatchSessions(sessionsAllotted, possibleDates, filteredSlotsString, slots, mentorUserId, courseId, batchType);
        }
        if (possibleSessionCount > 0) {
          // all the remaining sessions have to be created
          const startFromIndex = allottedSessionsCount;
          possibleDates = possibleDates.slice(startFromIndex);
          const topicStartIndex = topicCount - possibleSessionCount;
          topics = topics.splice(topicStartIndex);
        } else {
          createBatchSessions(batchId, possibleDates, filteredSlotsString, slots, possibleSessionCount, topics, mentorUserId, courseId, batchType);
        }
      } else {
        // if there are no exisiting batchSessions for the given batch id, create all of them
        const possibleSessionCount = topicCount;
        const possibleDates = getPossibleDates(startDate, endDate, days);
        createBatchSessions(batchId, possibleDates, filteredSlotsString, slots, possibleSessionCount, topics, mentorUserId, courseId, batchType);
      }
    }
  } else {
    // if adhoc and recurring, return
    if (isRecurring) {
      return;
    }
    const finalMentorSessionId = await getMentorSessionId(mentorUserId, startDate, filteredSlotsString, courseId, sessionType);
    createAdhocSession(batchId, startDate, filteredSlotsString, topicId, finalMentorSessionId, courseId);
  }
  return {
    result: true,
  };
};

export default scheduleSessionsMutationResolver;
