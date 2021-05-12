import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
} from '../../../../constants';
import { log } from '../../../../utils';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getFirstTopicAndLearningObjective from '../../utils/getFirstTopicAndLearningObjective';

// query to get published topics count 
const getTopicMeta = async () => {
  const query = `
          {
            topicsMeta(filter: {status: published}){
              count
            }
          }
          `;
  const topicMeta = await callLocalGraphqlApi(query);
  return get(topicMeta, 'data.topicsMeta');
};

// query to get batch sessions (started, completed)
const getBatchSessions = async (batchId) => {
  const query = `
          {
            batchSessions(filter: {batch_some: {id: "${batchId}"}}){
              id
            }
          }
          `;
  const batches = await callLocalGraphqlApi(query);
  return get(batches, 'data.batchSessions');
};

// query to get batch sessions (started, completed)
const getBatch = async (batchId) => {
  const query = `
          {
            batch(id:"${batchId}"){
              id
              timeTableRules{
                startDate
                endDate
                slot0
                slot1
                slot2
                slot3
                slot4
                slot5
                slot6
                slot7
                slot8
                slot9
                slot11
                slot12
                slot13
                slot14
                slot15
                slot16
                slot17
                slot18
                slot19
                slot20
                slot21
                slot22
                slot23
                sunday
                monday
                tuesday
                wednesday
                thursday
                friday
                saturday
              }
            }
          }
          `;
  const currBatch = await callLocalGraphqlApi(query);
  return get(currBatch, 'data.batch');
};

// method to return the terms that do not match from present query and stored db
const getDiff = (timeTableRules, fetchedTimeTableRules) => {
  let result = {}
  if (timeTableRules.startDate && timeTableRules.startDate !== fetchedTimeTableRules.startDate) {
    result.startDate = timeTableRules.startDate;
  } else {
    result.startDate = fetchedTimeTableRules.startDate;
  }
  if (timeTableRules.endDate && timeTableRules.endDate !== fetchedTimeTableRules.endDate) {
    result.endDate = timeTableRules.endDate;
  } else {
    result.endDate = fetchTimeTableRules.endDate;
  }
  // result.slot = getSlotDiff(timeTableRules, fetchedTimeTableRules);
  // result.day = getDayDiff(timeTableRules, fetchedTimetableRules);
  return result;
}

// method to sort batchSessions
const sortBatchSessions = (batchSessions) => {
  const sessions_sc = [];
  const sessions_a = [];

  batchSessions.map(item => {
    if (item.sessionsStatus === 'allotted') {
      sessions_a.push(item);
    } else {
      sessions_sc.push(item);
    }
  })

  return { sessions_sc, sessions_a };

}

// method that returns the array of dates
const getPossibleDates = (startDate, endDate, days) => {

  const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const start = new Date();



}


/*
  Post hook of update batch
*/
const updateBatchPostHookMethod = async (input, params, _mutationName, _context) => {
  const { id: batchId, input: { timeTableRules } } = params;
  console.log(input);
  console.log(params);
  /*
    TODO : 
    -> Fetch total number of published topics (x) of the course, this will be the max possible number of batchSessions
    -> Fetch batchSessions that are either in the started or completed state (y)
    -> compare fields (fromDate, toDate, slot and weekdays) which are alredy stored in the database and which are passed as input
    -> make an array of Date, on which batchSessions are to be created (start > currentDate)(max = x-y), if beyond max throw interval too big error
    -> if there are no batchSessions in the Db, create batchSessions for all the dates in the date array
    -> if there are some batchSessions, update the remaining batchSessions with the new passed values and create batchSessions if necessary.
  */

  const topicsMeta = await getTopicMeta();
  const topicCount = topicsMeta.count;

  // the batch sessions 
  const batchSessions = await getBatchSessions(batchId);
  if (batchSessions) {

    // sort batch sessions into started/completed (sc) and alloted (a)
    const { sessions_sc, sessions_a } = sortBatchSessions(batchSessions);

    if (sessions_sc.length > 0) {
      const possibleSessionCount = topicCount - sessions_sc.length;

    }


  } else {

    // if there are no exisiting batchSessions for the given batch id, we create all of them

    // we need to get an array of Dates when we want the batch Session to be created,
    // it has to be between from and to passed in the query
    // it has to be greater than currentDate

  }

  // get the current state of the batch to decide what to do next
  const batch = await getBatch(batchId)
  console.log(timeTableRules)
  const fetchedTimeTableRules = batch.timeTableRules
  console.log('hi')
  if (timeTableRules && fetchedTimeTableRules) {
    // make the comparison here
    const diffTerms = getDiff(timeTableRules, fetchedTimeTableRules);
    console.log(diffTerms);
  }


};

export default updateBatchPostHookMethod;
