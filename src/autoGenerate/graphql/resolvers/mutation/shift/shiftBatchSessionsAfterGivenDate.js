/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { fetchAllottedBatchSessions } from '../../../postHookFunctions/utils/removeFromBatchStudentProfileHelperMethods';
import isDateInPast from '../../../../../../utils/isDateInPast';
import isEqualDates from '../../../../../../utils/isEqualDates';
import { log } from '../../../../../../utils/log';
import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';

/*
- Takes date and batchId as i/p, and fetches all allotted batch sessions
- loops through all fetches sessions and deletes ones booked for before given date
- for all remaining sessions, updates topic id starting from the one first deleted
*/
const deleteBatchSession = (sessionId) => `
  mutation{
    deleteBatchSession(id: "${sessionId}"){
      id
    }
  }
`;

const updateBatchSession = (sessionId, topicId) => `
mutation{
  updateBatchSession(id: "${sessionId}",
    topicConnectId: "${topicId}"){
    id
  }
}
`;

const fetchBatch = (batchId) => `
query{
  batches(filter: {id: "${batchId}"}){
    id
    course{
      id
    }
  }
}
`;

const fetchTopics = (topicOrder, courseId) => `
query{
  topics(filter: {
    and: [
      {courses_some: {id: "${courseId}"}}
      {order_gte: ${topicOrder}}
    ]
  }orderBy: order_ASC){
    id
    order
  }
}
`;

const shiftBatchSessionsMutationResolver = async (
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
  const { input: { date: inputDate, batchId, ...slots } } = params;
  const inputSlotTimeArray = getSelectedSlotsTime(slots);
  try {
    const batchSessions = await fetchAllottedBatchSessions(batchId);
    // fetch courseId here
    const batchesRes = await callLocalGraphqlApi(fetchBatch(batchId));
    const batches = get(batchesRes, 'data.batches', []);
    const courseId = get(batches, '[0].course.id', '');
    let firstTopicOrderToBeDeleted = null;
    let topicsRemaining = null;
    let topicsUpdatedCounter = 0;
    /* eslint-disable-next-line no-restricted-syntax */
    for (const batchSession of batchSessions) {
      const dateOfBooking = get(batchSession, 'bookingDate');
      const sessionId = get(batchSession, 'id');
      const sessionSlotTimeArray = getSelectedSlotsTime(batchSession);
      const isSameDay = isEqualDates(dateOfBooking, inputDate);
      let isTimeInPast = false;
      if (isSameDay) {
        if (sessionSlotTimeArray.length === 1
          && inputSlotTimeArray.length === 1
          && inputSlotTimeArray[0] <= sessionSlotTimeArray[0]) {
          isTimeInPast = true;
        }
      }
      // equal dates and slots check
      if (isDateInPast(dateOfBooking, new Date(inputDate)) || (isSameDay && isTimeInPast)) {
        if (!firstTopicOrderToBeDeleted) {
          firstTopicOrderToBeDeleted = get(batchSession, 'topic.order');
        }
        // add variable in context to bypass slots in past error
        context.previousDocument = 'shiftBatch';
        await callLocalGraphqlApi(deleteBatchSession(sessionId, context));
        log(`Deleted batch session with sessionId ${sessionId} and order ${get(batchSession, 'topic.order')}`);
      } else {
        // if firstTopicOrderToBeDeleted = null, we can assume we haven't deleted any sessions
        if (!firstTopicOrderToBeDeleted) {
          log('No allotted batch sessions found before or on given date and slot.');
          break;
        }
        // fetch topics (if not already feched), starting from firstTopicOrderToBeDeleted
        if (!topicsRemaining) {
          const topicsRemainingRes = await callLocalGraphqlApi(fetchTopics(firstTopicOrderToBeDeleted, courseId));
          topicsRemaining = get(topicsRemainingRes, 'data.topics', []);
          log('Fetched Topics');
        }
        const topicIdToUpdate = get(topicsRemaining, `[${topicsUpdatedCounter}].id`);
        await callLocalGraphqlApi(updateBatchSession(sessionId, topicIdToUpdate));
        log(`Updated session ${sessionId} with topicConnectId ${topicIdToUpdate}`);
        topicsUpdatedCounter += 1;
      }
    }
    // FUTURE ENHANCEMENT : add new batch sessions for remaining topics yet to be connected
  } catch (err) {
    return {
      error: err,
    };
  }
  return {
    result: true,
  };
};

export default shiftBatchSessionsMutationResolver;
