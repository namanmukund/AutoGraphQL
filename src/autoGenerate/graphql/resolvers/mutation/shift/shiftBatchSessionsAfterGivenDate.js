import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { fetchAllottedBatchSessions } from '../../../postHookFunctions/utils/removeFromBatchStudentProfileHelperMethods';
import isDateInPast from '../../../../../../utils/isDateInPast';
import isEqualDates from '../../../../../../utils/isEqualDates';
import log from '../../../../../../utils/log';

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

const fetchTopics = (topicOrder, courseId) => `
query{
  topics(filter: {
    and: [
      {courses_some: {id: "${courseId}"}}
      {order_gte: ${topicOrder}}
    ]
  }){
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
  ast,
  context,
) => {
  validateAuthentication(context);
  const { input: { date: inputDate, batchId } } = params;
  try {
    const batchSessions = await callLocalGraphqlApi(fetchAllottedBatchSessions(batchId));
    let firstTopicOrderToBeDeleted = null;
    let topicsRemaining = null;
    let topicsUpdatedCounter = 0;
    for (const batchSession of batchSessions) {
      const dateOfBooking = get(batchSession, 'bookingDate');
      const sessionId = get(batchSession, 'id');
      if (isDateInPast(dateOfBooking, inputDate) || isEqualDates(dateOfBooking, inputDate)) {
        if (!firstTopicOrderToBeDeleted) {
          firstTopicOrderToBeDeleted = get(batchSession, 'topic.order');
        }
        await callLocalGraphqlApi(deleteBatchSession(sessionId));
        log(`Deleted batch session with sessionId ${sessionId} and order ${get(batchSession, 'topic.order')}`);
      } else {
        // if firstTopicOrderToBeDeleted = null, we can assume we haven't deleted any sessions
        if (!firstTopicOrderToBeDeleted) {
          log('No allotted batch sessions found before or on given date.');
          break;
        }
        // fetch topics (if not already feched), starting from firstTopicOrderToBeDeleted
        if (!topicsRemaining) {
          const topicsRemainingRes = await callLocalGraphqlApi(fetchTopics(firstTopicOrderToBeDeleted));
          topicsRemaining = get(topicsRemainingRes, 'data.topics', []);
        }
        const topicIdToUpdate = get(topicsRemaining, `[${topicsUpdatedCounter}].id`);
        await updateBatchSession(sessionId, topicIdToUpdate);
        log(`Updated session ${sessionId} with topicConnectId ${topicIdToUpdate}`);
        topicsUpdatedCounter += 1;
      }
    }
    // TODO : add new batch sessions in the end for remaining topics yet to be connected
  } catch (err) {
    return {
      error: 'Error while trying to shift batch sessions',
    };
  }
  return {
    result: true,
  };
};

export default shiftBatchSessionsMutationResolver;
