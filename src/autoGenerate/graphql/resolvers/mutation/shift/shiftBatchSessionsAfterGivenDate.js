import { get } from 'lodash';
// import validateAuthentication from '../../../../../../utils/validateAuthentication';
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
  // validateAuthentication(context);
  console.log('Inside custom mutation')
  const { input } = params;
  console.log('input', input);
  const batchId = get(input, 'batchId');
  const inputDate = get(input, 'date');
  console.log('batchId', batchId);
  console.log('inputDate', inputDate);
  try {
    const batchSessions = await fetchAllottedBatchSessions(batchId);
    // fetch courseId here
    console.log('inputDate', inputDate);
    console.log('batchId', batchId);
    const batchesRes = await callLocalGraphqlApi(fetchBatch(batchId));
    const batches = get(batchesRes, 'data.batches', []);
    const courseId = get(batches, '[0].course.id', '');
    console.log('courseId', courseId);
    let firstTopicOrderToBeDeleted = null;
    let topicsRemaining = null;
    let topicsUpdatedCounter = 0;
    console.log('batchsessions', batchSessions);
    for (const batchSession of batchSessions) {
      const dateOfBooking = get(batchSession, 'bookingDate');
      const sessionId = get(batchSession, 'id');
      console.log('dateOfBooking', dateOfBooking);
      console.log('sessionId', sessionId);

      // TODO : equal dates and slots check
      if (isDateInPast(dateOfBooking, new Date(inputDate)) || isEqualDates(dateOfBooking, inputDate)) {
        if (!firstTopicOrderToBeDeleted) {
          firstTopicOrderToBeDeleted = get(batchSession, 'topic.order');
        }
        // TODO : add variable in context to bypass slots in past error
        await callLocalGraphqlApi(deleteBatchSession(sessionId));
        console.log(`Deleted batch session with sessionId ${sessionId} and order ${get(batchSession, 'topic.order')}`);
      } else {
        // if firstTopicOrderToBeDeleted = null, we can assume we haven't deleted any sessions
        if (!firstTopicOrderToBeDeleted) {
          log('No allotted batch sessions found before or on given date.');
          break;
        }
        // fetch topics (if not already feched), starting from firstTopicOrderToBeDeleted
        if (!topicsRemaining) {
          const topicsRemainingRes = await callLocalGraphqlApi(fetchTopics(firstTopicOrderToBeDeleted, courseId));
          topicsRemaining = get(topicsRemainingRes, 'data.topics', []);
        }
        const topicIdToUpdate = get(topicsRemaining, `[${topicsUpdatedCounter}].id`);
        await updateBatchSession(sessionId, topicIdToUpdate);
        log(`Updated session ${sessionId} with topicConnectId ${topicIdToUpdate}`);
        topicsUpdatedCounter += 1;
      }
    }
    // FUTURE ENHANCEMENT : add new batch sessions for remaining topics yet to be connected
  } catch (err) {
    console.log(err)
    return {
      error: 'Error while trying to shift batch sessions',
    };
  }
  return {
    result: true,
  };
};

export default shiftBatchSessionsMutationResolver;
