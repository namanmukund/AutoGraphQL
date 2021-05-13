// import { get } from 'lodash';
// import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import extractSlotsFromInput from './utils/extractSlotsFromInput';
import getSelectedDays from './utils/getSelectedDays';
import getPossibleDates from './utils/getPossibleDates';
/* eslint-disable object-curly-newline */
import { getTopicMeta, getBatchSessions, getBatch, createBatchSession, updateBatchSession } from './utils/updateBatchPostHookQueries';

const createBatchSessions = async (batchId, possibleDates, filteredSlots, possibleSessionCount) => {
  if (possibleDates.length <= possibleSessionCount) {
    possibleDates.forEach((date) => createBatchSession(batchId, date, filteredSlots));
  } else {
    for (let i = 0; i < possibleSessionCount; i += 1) {
      createBatchSession(batchId, possibleDates[i].toISOString(), filteredSlots);
    }
  }

  return true;
};

const updateAllottedBatchSessions = async (sessionsAllotted, possibleDates, filteredSlotsString) => {
  let i = 0;
  /* eslint-disable array-callback-return */
  sessionsAllotted.map((sessionId) => {
    /* eslint-disable array-callback-return */
    const date = possibleDates[i].toISOString();
    updateBatchSession(sessionId, filteredSlotsString, date);
    i += 1;
  });
};

// method to sort batchSessions
const sortBatchSessions = (batchSessions) => {
  const sessionsStartedOrCompleted = [];
  const sessionsAllotted = [];

  batchSessions.map((item) => {
    /* eslint-disable array-callback-return */
    if (item.sessionsStatus === 'allotted') {
      sessionsAllotted.push(item);
    } else {
      sessionsStartedOrCompleted.push(item);
    }
  });

  return { sessionsStartedOrCompleted, sessionsAllotted };
};

/*
  Post hook of update batch
*/
/* eslint-disable no-unused-vars */
const updateBatchPostHookMethod = async (input, params, mutationName, context) => {
  const { id: batchId, input: { timeTableRule } } = params;
  /*
    -> Fetch total number of published topics (x), this will be the max possible number of batchSessions
    -> Fetch batchSessions that are either in the started or completed state (y)
    -> compare fields (fromDate, toDate, slot and weekdays) which are alredy stored in the database and which are passed as input
    -> make an array of Date, on which batchSessions are to be created (start > currentDate)(max = x-y), if beyond max throw interval too big error
    -> if there are no batchSessions in the Db, create batchSessions for all the dates in the date array
    -> if there are some batchSessions, update the remaining batchSessions with the new passed values and create batchSessions if necessary.
  */
  // topic count
  const topicsMeta = await getTopicMeta();
  const topicCount = topicsMeta.count;

  // current batch
  /* eslint-disable no-unused-vars */
  const batch = await getBatch(batchId);

  // batch sessions
  const batchSessions = await getBatchSessions(batchId);

  // start, end dates
  const days = getSelectedDays(timeTableRule);
  const startDate = new Date(timeTableRule.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(timeTableRule.endDate);
  endDate.setHours(0, 0, 0, 0);

  // slots passed in input
  const { ...slots } = timeTableRule;
  const { filteredSlotsString } = extractSlotsFromInput(slots);

  if (batchSessions) {
    // sorting the existing batch sessions into started/completed and allotted
    const { sessionsStartedOrCompleted, sessionsAllotted } = sortBatchSessions(batchSessions);
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
      await updateAllottedBatchSessions(sessionsAllotted, possibleDates, filteredSlotsString);
    }
    if (possibleSessionCount > 0) {
      // all the remaining sessions have to be created
      const startFromIndex = allottedSessionsCount;
      possibleDates = possibleDates.splice(startFromIndex);
      await createBatchSessions(batchId, possibleDates, filteredSlotsString, possibleSessionCount);
    }
  } else {
    // if there are no exisiting batchSessions for the given batch id, create all of them
    const possibleSessionCount = topicCount;
    const possibleDates = getPossibleDates(startDate, endDate, days);
    await createBatchSessions(batchId, possibleDates, filteredSlotsString, possibleSessionCount);
  }
};

export default updateBatchPostHookMethod;
