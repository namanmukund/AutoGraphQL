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
import getCombinedSchedules from '../../../postHookFunctions/utils/getCombinedSchedulesForBatch';
import checkIfOutsideWorkingSchedule from '../../../postHookFunctions/utils/checkIfOutsideWorkingSchedule';
import getScheduleSessionsRulesGroupedByDay from '../../../postHookFunctions/utils/getScheduledSessionsRulesGroupedByDay';
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
import {
  getTopics, getBatchSessions, createBatchSession, updateBatchSession,
  createAdhocSession, getAdhocSessions, updateAdhocSession, getBatchSession,
  getAdhocSession,
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
import { SimilarDocumentAlreadyExistError } from '../../../../../../constants/errors/db';

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
      if (sentSlotsArray && sentSlotsArray.length) {
        // eslint-disable-next-line no-await-in-loop
        const addMentorSessionRes = await callLocalGraphqlApi(addMentorSession(allottedMentorId, courseId, date, `slot${sentSlotsArray[0]}`, sessionType));
        finalMentorSessionId = get(addMentorSessionRes, 'data.addMentorSession.id');
      }
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
  const sessionType = get(timeTableRule, 'scheduleSessionType', 'batch');

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

  let startDate = timeTableRule.startDate ? new Date(timeTableRule.startDate) : null;
  if (startDate) {
    startDate.setHours(0, 0, 0, 0);
  }
  const endDate = timeTableRule.endDate ? new Date(timeTableRule.endDate) : null;
  if (endDate) {
    endDate.setHours(0, 0, 0, 0);
  }

  // nonRecurringslots passed in input (non-recurring)
  // for non recurring cases, we only consider first object in array as input
  const { ...nonRecurringslots } = get(scheduleSessionsRules, '[0]', {});
  const { filteredSlotsString: nonRecurringfilteredSlotsString, filteredSlotsStringForFilterQuery } = extractSlotsFromInput(nonRecurringslots);

  // to reschedule single session
  if (doReschedule && startDate) {
    if (!adhocSessionId && !batchSessionId) {
      throw new InvalidRescheduleParameters();
    } else if (adhocSessionId && batchSessionId) {
      throw new InvalidRescheduleParameters();
    } else {
      // check if sessions already exist at provided date and slot and have to reschedule batch session
      const sessionsExist = await sessionExistsCheck(nonRecurringslots, batchId, startDate);
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

  const daysRule = getScheduleSessionsRulesGroupedByDay(scheduleSessionsRules);
  const days = getSelectedDays(daysRule);
  let topics = await getTopics(courseId);
  const topicCount = topics && topics.length;
  const batchSessions = await getBatchSessions(batchId);

  if (doReschedule && !startDate) {
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
      startDate = get(sessionsAllotted, '[0].bookingDate', new Date());

      // let possibleDates = getPossibleDates(startDate, endDate, days);
      const possibleDates = await getPossileDatesFromRule(startDate, endDate, daysRule);

      // for the sessions which are still in the allotted state, update them
      const allottedSessionsCount = sessionsAllotted.length;
      if (allottedSessionsCount > 0) {
        possibleSessionCount -= allottedSessionsCount;
        updateAllottedBatchSessions(sessionsAllotted, possibleDates, mentorUserId, courseId, batchType);
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

  // combine school and batch timetableschedules
  const { combinedWorkingDaySchedule, combinedEventScheduleArray } = getCombinedSchedules(batch);

  // See if force flag is set to false or not sent in input
  const forceScheduleSessions = get(timeTableRule, 'forceScheduleSessions', false);

  if (!forceScheduleSessions && combinedWorkingDaySchedule.startDate) {
    const { isOutsideWorkingSchedule, errorMessage } = checkIfOutsideWorkingSchedule(combinedWorkingDaySchedule, combinedEventScheduleArray, timeTableRule, daysRule);
    if (isOutsideWorkingSchedule) {
      throw new CannotScheduleOutsideWorkingHoursError({
        data: {
          message: errorMessage,
        },
      });
    }
  }

  // if force schedule, we can schedule anywhere irrespective of working day or event schedule
  if (sessionType === 'batch') {
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
      const batchSessionRes = await callLocalGraphqlApi(getBatchSession(batchId, topicId));
      const existingBatchSessions = get(batchSessionRes, 'data.batchSessions', []);
      const existingSessionDate = get(existingBatchSessions, '[0].bookingDate', null);
      if (existingBatchSessions.length) {
        throw new SimilarDocumentAlreadyExistError({
          data: {
            message: `Session with same topic for the same batch exists on ${moment(existingSessionDate).format('Do MMM YYYY')}.`,
          },
        });
      }
      const finalMentorSessionId = await getMentorSessionId(mentorUserId, startDate, nonRecurringslots, courseId, 'batch');
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
    const finalMentorSessionId = await getMentorSessionId(mentorUserId, startDate, nonRecurringslots, courseId, 'batch');
    createAdhocSession(batchId, startDate, nonRecurringfilteredSlotsString, topicId, finalMentorSessionId, courseId);
  }
  return {
    result: true,
  };
};

export default scheduleSessionsMutationResolver;
