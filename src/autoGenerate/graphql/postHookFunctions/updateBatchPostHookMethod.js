import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import extractSlotsFromInput from './utils/extractSlotsFromInput'
import getSelectedDays from './utils/getSelectedDays';
import getPossibleDates from './utils/getPossibleDates';

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


const getSlotsString = (slots) => {

}

const createBatchSession = async (batchId, date, slots) => {
  const query = `
          mutation{
            addBatchSession(batchConnectId: "${batchId}",
            input:{
              bookingDate:"${date}",
              ${slots}
            }
            ){
              id
            }
          }
          `;
  await callLocalGraphqlApi(query);
  console.log(`created batch session! for ${date}`);
  return true;
}

const createBatchSessions = async (batchId, possibleDates, filteredSlots) => {
  possibleDates.forEach(date => createBatchSession(batchId, date, filteredSlots));
  return true;
}

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
    result.endDate = fetchedTimeTableRules.endDate;
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

/*
  Post hook of update batch
*/
const updateBatchPostHookMethod = async (input, params, _mutationName, _context) => {
  const { id: batchId, input: { timeTableRules } } = params;
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
  // get the current state of the batch to decide what to do next
  const batch = await getBatch(batchId)

  // the batch sessions 
  const batchSessions = await getBatchSessions(batchId);

  if (batchSessions) {
    // TODO : for condition where previous batch sessions are present, write code..
    const { sessions_sc, sessions_a } = sortBatchSessions(batchSessions);
    if (sessions_sc.length > 0) {
      const possibleSessionCount = topicCount - sessions_sc.length;
    }
  } else {

    // if there are no exisiting batchSessions for the given batch id, we create all of them
    // make the comparison here
    const diffTerms = getDiff(timeTableRules, fetchedTimeTableRules);


  }

  const days = getSelectedDays(timeTableRules);
  const startDate = new Date(timeTableRules.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(timeTableRules.endDate);
  endDate.setHours(0, 0, 0, 0);

  const possibleDates = getPossibleDates(startDate, endDate, days);
  // console.log(possibleDates);

  const { ...slots } = timeTableRules;
  const { filteredSlots, filteredSlotsString } = extractSlotsFromInput(slots);
  await createBatchSessions(batchId, possibleDates, filteredSlotsString);


  const fetchedTimeTableRules = batch.timeTableRules
  if (timeTableRules && fetchedTimeTableRules) {


  }


};

export default updateBatchPostHookMethod;
