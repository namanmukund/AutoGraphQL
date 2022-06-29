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
  getTopicsFromCoursePackage,
  getCourseIdFromTopic,
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
import getSortedTopics from '../../../../../../utils/getSortedTopicsFromCoursePackageOrder';

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
const getMentorSessionId = async (allottedMentorId, date, slotsInInput, courseId, sessionType, coursePackageId, startTime, endTime) => {
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
        await callLocalGraphqlApi(updateMentorSession(mentorSessionId, date, `slot${sentSlotsArray[0]}`, coursePackageId));
      }
    } else {
      if (sentSlotsArray && sentSlotsArray.length) {
        // eslint-disable-next-line no-await-in-loop
        const addMentorSessionRes = await callLocalGraphqlApi(addMentorSession(allottedMentorId, courseId, date, `slot${sentSlotsArray[0]}`, sessionType, coursePackageId, startTime, endTime));
        finalMentorSessionId = get(addMentorSessionRes, 'data.addMentorSession.id');
      }
    }
  }
  return finalMentorSessionId;
};

// create batch sessions according to remaining topics and required number of sessions
const createBatchSessions = async (batchId, possibleDates, possibleSessionCount, topics, allottedMentorId, courseId, batchType, isCoursePackageBatch, coursePackageId) => {
  if (possibleDates.length <= possibleSessionCount) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [index, possibleDate] of possibleDates.entries()) {
      // const index = possibleDates.map((e) => e.date).indexOf(possibleDate);
      const topicOrder = isCoursePackageBatch ? topics[index].coursePackageOrder : topics[index].order;
      let sessionType = 'batch';

      if (batchType === 'b2b2c' && topicOrder === 1) {
        sessionType = 'trial';
      }
      const slotObj = {};
      slotObj[possibleDate.slot] = true;
      const { filteredSlotsString } = extractSlotsFromInput(slotObj);
      const finalCourseId = isCoursePackageBatch ? get(topics[index], 'courses[0].id') : courseId;
      const startTime = possibleDate.startTime;
      const endTime = possibleDate.endTime;
      const sessionMode = possibleDate.mode;
      // eslint-disable-next-line no-await-in-loop
      const finalMentorSessionId = await getMentorSessionId(allottedMentorId, possibleDate.date, slotObj, finalCourseId, sessionType, coursePackageId, startTime, endTime);

      createBatchSession(batchId, possibleDate.date.toISOString(), filteredSlotsString, topics[index].id, finalMentorSessionId, finalCourseId, coursePackageId, startTime, endTime, sessionMode);
    }
  } else {
    for (let i = 0; i < possibleSessionCount; i += 1) {
      const topicOrder = isCoursePackageBatch ? topics[i].coursePackageOrder : topics[i].order;
      let sessionType = 'batch';

      if (batchType === 'b2b2c' && topicOrder === 1) {
        sessionType = 'trial';
      }

      const slotObj = {};
      slotObj[possibleDates[i].slot] = true;
      const finalCourseId = isCoursePackageBatch ? get(topics[i], 'courses[0].id') : courseId;
      const startTime = possibleDates[i].startTime;
      const endTime = possibleDates[i].endTime;
      const sessionMode = possibleDates[i].mode;
      // eslint-disable-next-line no-await-in-loop
      const finalMentorSessionId = await getMentorSessionId(allottedMentorId, possibleDates[i].date, slotObj, finalCourseId, sessionType, coursePackageId, startTime, endTime);
      const { filteredSlotsString } = extractSlotsFromInput(slotObj);

      createBatchSession(batchId, possibleDates[i].date.toISOString(), filteredSlotsString, topics[i].id, finalMentorSessionId, finalCourseId, coursePackageId, startTime, endTime, sessionMode);
    }
  }
  return true;
};

// update existing batch sessions with topic id
const updateAllottedBatchSessions = async (sessionsAllotted, possibleDates, allottedMentorId, courseId, batchType, isCoursePackageBatch, coursePackageId) => {
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
    const finalCourseId = isCoursePackageBatch ? get(session, 'course.id') : courseId;
    /* eslint-disable array-callback-return */
    const date = possibleDates[i].date.toISOString();
    const startTime = possibleDates[i].startTime;
    const endTime = possibleDates[i].endTime;
    const sessionMode = possibleDates[i].mode;
    // eslint-disable-next-line no-await-in-loop
    const finalMentorSessionId = await getMentorSessionId(allottedMentorId, possibleDates[i].date, slotObj, finalCourseId, sessionType, coursePackageId, startTime, endTime);
    const { filteredSlotsString } = extractSlotsFromInput(slotObj);

    updateBatchSession(session.id, filteredSlotsString, date, finalMentorSessionId, finalCourseId, coursePackageId, startTime, endTime, sessionMode);
    i += 1;
  }
};

// check if sessions already exist at provided date and slot
const sessionExistsCheck = async (rescheduleSlots, batchId, startDate, startMinutes, endMinutes) => {
  const sentSlotsArray = getSelectedSlotsTime(rescheduleSlots);
  const dates = [];
  dates.push(startDate);
  if (endMinutes) {
    if (endMinutes > 60) {
      let i = 1;
      let tempEndMinutes = endMinutes;
      while (tempEndMinutes > 60) {
        let laterSlot = sentSlotsArray[0] + i;
        if (laterSlot > 23) {
          dates.push(moment(new Date(startDate)).addDays(1).toDate());
          laterSlot -= 23;
        }
        sentSlotsArray.push(laterSlot);
        i += 1;
        tempEndMinutes -= 60;
      }
    }
  }
  if (sentSlotsArray[0] - 1 >= 0) {
    sentSlotsArray.push(sentSlotsArray[0] - 1);
  }
  if (sentSlotsArray[0] - 2 >= 0) {
    sentSlotsArray.push(sentSlotsArray[0] - 2);
  }
  let slotInput = '{or: [';
  let dateInput = '{or: [';
  sentSlotsArray.forEach((slot) => { slotInput += `{slot${slot}: true}`; });
  dates.forEach((date) => { dateInput += `{bookingDate: "${date.toISOString()}"}`; });
  slotInput += ']}';
  dateInput += ']}';

  const batchSessionsOnSameDateAndSlot = await getBatchSessions(batchId, startDate, null, 'allotted', slotInput, dateInput);
  const adhocSessionsOnSameDateAndSlot = await getAdhocSessions(batchId, startDate, null, 'allotted', slotInput, dateInput);

  if (typeof startMinutes === 'number' && typeof endMinutes === 'number') {
    const inputSlot = sentSlotsArray[0];
    const inputStartMinutes = (inputSlot * 60) + startMinutes;
    const inputEndMinutes = (inputSlot * 60) + endMinutes;
    for (const batchSession of batchSessionsOnSameDateAndSlot) {
      const sessionSlot = getSelectedSlotsTime(batchSession);
      const sessionStartMinutes = (sessionSlot * 60) + get(batchSession, 'startMinutes', 0);
      const sessionEndMinutes = (sessionSlot * 60) + get(batchSession, 'endMinutes', 0);
      if (!(inputEndMinutes <= sessionStartMinutes || inputStartMinutes >= sessionEndMinutes)) {
        return true;
      }
    }
    for (const adhocSession of adhocSessionsOnSameDateAndSlot) {
      const sessionSlot = getSelectedSlotsTime(adhocSession);
      const sessionStartMinutes = (sessionSlot * 60) + get(adhocSession, 'startMinutes', 0);
      const sessionEndMinutes = (sessionSlot * 60) + get(adhocSession, 'endMinutes', 0);
      if (!(inputEndMinutes <= sessionStartMinutes || inputStartMinutes >= sessionEndMinutes)) {
        return true;
      }
    }
  } else {
    if (batchSessionsOnSameDateAndSlot.length > 0 || adhocSessionsOnSameDateAndSlot.length > 0) {
      return true;
    }
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
        }
        if (key.includes('Time')) {
          dateObj[key] = daysRule[dayMapping[currentDate.getDay()]][key];
        }
        if (key.includes('Mode')) {
          dateObj.mode = daysRule[dayMapping[currentDate.getDay()]][key];
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
  let courseId = get(timeTableRule, 'courseId');
  const topicId = get(timeTableRule, 'topicId');
  const isRecurring = get(timeTableRule, 'isRecurring');
  const doReschedule = get(timeTableRule, 'doReschedule', false);
  const batchSessionId = get(timeTableRule, 'batchSessionId', '');
  const adhocSessionId = get(timeTableRule, 'adhocSessionId', '');
  const forceShiftSessions = get(timeTableRule, 'forceShiftSessions', false);
  const sessionType = get(timeTableRule, 'scheduleSessionType', 'batch');
  const adhocSessionType = get(timeTableRule, 'adhocSessionType', 'revision');

  let batch = null;
  if (!doReschedule) {
    batch = await fetchBatch(get(timeTableRule, 'batchId', ''));
  } else if (batchSessionId) {
    batch = get(await fetchBatchSession(batchSessionId), 'batch', null);
  } else {
    batch = get(await fetchAdhocSession(adhocSessionId), 'batch', null);
  }
  const coursePackageId = get(batch, 'coursePackage.id', '');
  const batchId = get(batch, 'id');

  if (!batchId) {
    throw new DatabaseRecordNotFoundError();
  }
  const mentorUserId = get(batch, 'allottedMentor.id', '');
  const batchType = get(batch, 'type');
  if (!courseId && !coursePackageId) {
    courseId = get(batch, 'course.id', '');
  }

  let startDate = timeTableRule.startDate ? new Date(timeTableRule.startDate) : null;
  if (startDate) {
    startDate.setHours(0, 0, 0, 0);
  }
  let endDate = timeTableRule.endDate ? new Date(timeTableRule.endDate) : null;
  if (endDate) {
    endDate.setHours(0, 0, 0, 0);
  }

  // nonRecurringslots passed in input (non-recurring)
  // for non recurring cases, we only consider first object in array as input
  const { ...nonRecurringslots } = get(scheduleSessionsRules, '[0]', {});
  const { filteredSlotsString: nonRecurringfilteredSlotsString, filteredSlotsStringForFilterQuery } = extractSlotsFromInput(nonRecurringslots);
  const startMinutes = get(nonRecurringslots, 'startTime', 0);
  const endMinutes = get(nonRecurringslots, 'endTime', 0);

  if ((endMinutes - startMinutes > 120) || (endMinutes < startMinutes) || (startMinutes > 59)) {
    throw new InvalidScheduleParameters();
  }

  let classMode;
  for (const key in nonRecurringslots) {
    if (key.includes('Mode')) {
      classMode = nonRecurringslots[key];
    }
  }

  // combine school and batch timetableschedules
  const { combinedWorkingDaySchedule, combinedEventScheduleArray } = getCombinedSchedules(batch);

  const daysRule = getScheduleSessionsRulesGroupedByDay(scheduleSessionsRules);

  if (Object.keys(daysRule).length === 0) {
    const dayIndex = moment(timeTableRule.startDate).day();
    const dayMapping = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayVal = dayMapping[dayIndex];
    daysRule[dayVal] = {};
    for (const key2 in scheduleSessionsRules[0]) {
      if ((key2.includes('slot') && scheduleSessionsRules[0][key2])
        || (key2 === 'startTime' || key2 === 'endTime')) {
        daysRule[dayVal][key2] = key2.includes('slot') ? true : scheduleSessionsRules[0][key2];
      }
    }
  }

  // to reschedule single session
  if (doReschedule && startDate) {
    if (!adhocSessionId && !batchSessionId) {
      throw new InvalidRescheduleParameters();
    } else if (adhocSessionId && batchSessionId) {
      throw new InvalidRescheduleParameters();
    } else {
      // check if sessions already exist at provided date and slot and have to reschedule batch session
      const sessionsExist = await sessionExistsCheck(nonRecurringslots, batchId, startDate, startMinutes, endMinutes);
      if (sessionsExist && batchSessionId) {
        throw new SlotsOccupiedError();
      }
      // TODO : change logic to reschedule all sessions based on new timetable rules in array format
      if (forceShiftSessions) {
        log(`Shifting batch sessions before ${startDate.toISOString()} to after ${startDate.toISOString()}`);
        // callLocalGraphqlApi(shiftBatchSessionsAfterGivenDate(startDate, batchId, rescheduleSlots));
      }
      if (!timeTableRule.endDate) {
        timeTableRule.endDate = timeTableRule.startDate;
      }
      const { isOutsideWorkingSchedule, errorMessage } = await checkIfOutsideWorkingSchedule(combinedWorkingDaySchedule, combinedEventScheduleArray, timeTableRule, daysRule);
      if (isOutsideWorkingSchedule) {
        throw new CannotScheduleOutsideWorkingHoursError({
          data: {
            message: errorMessage,
          },
        });
      }
      if (adhocSessionId) {
        await updateAdhocSession(adhocSessionId, nonRecurringfilteredSlotsString, startDate, null, null, null, startMinutes, endMinutes, classMode);
      } else {
        await updateBatchSession(batchSessionId, nonRecurringfilteredSlotsString, startDate, null, null, null, startMinutes, endMinutes, classMode);
      }
    }
    return {
      result: true,
    };
  }

  const days = getSelectedDays(daysRule);
  let topics;
  let topicCount;
  let isCoursePackageBatch = false;
  if (coursePackageId) {
    isCoursePackageBatch = true;
    const coursePackage = await getTopicsFromCoursePackage(coursePackageId);
    let topicRules = get(coursePackage, 'topics', []);
    if (get(batch, 'coursePackageTopicRule', []).length) {
      topicRules = get(batch, 'coursePackageTopicRule', []);
    }
    topics = getSortedTopics(topicRules);
    topicCount = topics && topics.length;
  } else {
    topics = await getTopics(courseId);
    topicCount = topics && topics.length;
  }

  const batchSessions = await getBatchSessions(batchId);
  let courseIdFromTopic = courseId;
  if (topicId && coursePackageId) {
    courseIdFromTopic = await getCourseIdFromTopic(topicId);
  }

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
      startDate = get(sessionsAllotted, '[1].bookingDate', new Date());
      const endIndex = sessionsAllotted.length - 1;
      endDate = get(sessionsAllotted, `[${endIndex}].bookingDate`, new Date());
      endDate = moment(endDate).add(7, 'days').toDate();
      // let possibleDates = getPossibleDates(startDate, endDate, days);
      const possibleDates = await getPossileDatesFromRule(startDate, endDate, daysRule);

      // for the sessions which are still in the allotted state, update them
      const allottedSessionsCount = sessionsAllotted.length;

      if (allottedSessionsCount > 0) {
        possibleSessionCount -= allottedSessionsCount;
        updateAllottedBatchSessions(sessionsAllotted, possibleDates, mentorUserId, courseId, batchType, isCoursePackageBatch, coursePackageId);
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

  // See if force flag is set to false or not sent in input
  const forceScheduleSessions = get(timeTableRule, 'forceScheduleSessions', false);

  if (!forceScheduleSessions && combinedWorkingDaySchedule.startDate) {
    if (!timeTableRule.endDate) {
      timeTableRule.endDate = timeTableRule.startDate;
    }
    const { isOutsideWorkingSchedule, errorMessage } = await checkIfOutsideWorkingSchedule(combinedWorkingDaySchedule, combinedEventScheduleArray, timeTableRule, daysRule);
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
    const sessionsExist = await sessionExistsCheck(nonRecurringslots, batchId, startDate, startMinutes, endMinutes);
    if (sessionsExist) {
      if (!forceScheduleSessions && !isRecurring) {
        throw new SlotsOccupiedError();
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
      const finalMentorSessionId = await getMentorSessionId(mentorUserId, startDate, nonRecurringslots, courseIdFromTopic, 'batch', coursePackageId, startMinutes, endMinutes);
      if (!(batchId && startDate && nonRecurringfilteredSlotsString && topicId && finalMentorSessionId && courseIdFromTopic)) {
        throw new InvalidScheduleParameters();
      }
      await createBatchSession(batchId, startDate, nonRecurringfilteredSlotsString, topicId, finalMentorSessionId, courseIdFromTopic, coursePackageId, startMinutes, endMinutes, classMode);
    } else if (timeTableRule) {
      let possibleDates = await getPossileDatesFromRule(startDate, endDate, daysRule);
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

        // for the sessions which are still in the allotted state, update them
        const allottedSessionsCount = sessionsAllotted.length;
        if (allottedSessionsCount > 0) {
          possibleSessionCount -= allottedSessionsCount;
          updateAllottedBatchSessions(sessionsAllotted, possibleDates, mentorUserId, courseId, batchType, isCoursePackageBatch, coursePackageId);
        }
        if (possibleSessionCount > 0) {
          // all the remaining sessions have to be created
          const startFromIndex = allottedSessionsCount;
          possibleDates = possibleDates.slice(startFromIndex);
          const topicStartIndex = topicCount - possibleSessionCount;
          topics = topics.splice(topicStartIndex);
          createBatchSessions(batchId, possibleDates, possibleSessionCount, topics, mentorUserId, courseId, batchType, isCoursePackageBatch, coursePackageId);
        }
      } else {
        // if there are no exisiting batchSessions for the given batch id, create all of them
        createBatchSessions(batchId, possibleDates, topicCount, topics, mentorUserId, courseId, batchType, isCoursePackageBatch, coursePackageId);
      }
    }
  } else {
    // if adhoc and recurring, throw error
    if (isRecurring) {
      throw new InvalidScheduleParameters();
    }
    const finalMentorSessionId = await getMentorSessionId(mentorUserId, startDate, nonRecurringslots, courseIdFromTopic, 'batch', coursePackageId, startMinutes, endMinutes);
    await createAdhocSession(batchId, startDate, nonRecurringfilteredSlotsString, topicId, finalMentorSessionId, courseIdFromTopic, adhocSessionType, coursePackageId, startMinutes, endMinutes, classMode);
  }
  return {
    result: true,
  };
};

export default scheduleSessionsMutationResolver;
