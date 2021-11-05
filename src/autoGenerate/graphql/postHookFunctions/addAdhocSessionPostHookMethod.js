import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
} from '../../../../constants';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../constants/errors';
import { log } from '../../../../utils';
import extractSlotsFromInput from '../../../../utils/extractSlotsFromInput';
import getSelectedSlotsTime from '../preHookFunctions/validation/utils/getSelectedSlotsTime';

// query to get chapters and topics belomngin to a course
const getCourseQuery = () => `
    query{
      courses(filter:{
        and:[
          {title: "${GLOBAL_COURSE_TITLE}"},
          {status: ${PUBLISHED}}
        ]
      }){
        id
      }
    }
  `;

// query to get chapters and topics belomngin to a course
const getBatchQuery = (batchId) => `
    query{
      batch(id:"${batchId}"){
        id
        code
        students{
          id
          user{
            id
            source
            studentProfile{
              id
            }
          }
        }
        currentComponent{
          id
          latestSessionStatus
          currentTopic{
            id
          }
        }
      }
    }
  `;

// mutation to update adhoc sessions
const updateAdhocSessionQuery = (
  adhocSessionId, pushManyQuery,
) => `
  mutation{
    updateAdhocSession(id:"${adhocSessionId}",  input:{
      ${pushManyQuery}
    }){
      id
    }
  }
  `;

// query to get future batch sessions
const getBatchSessions = (batchId, bookingDate, slot) => `
    query{
      batchSessions(filter: {
        and: [
          {batch_some: {
            id: "${batchId}"
          }}
          {sessionStatus: allotted}
          {bookingDate: "${bookingDate}"}
          {slot${slot}: true}
        ]
      }){
        id
        topic{
          id
          order
        }
      }
    }
  `;

const shiftBatchSessionsAfterGivenDate = (date, batchId, slots) => `
  mutation{
  shiftBatchSessionsAfterGivenDate(input:{
    date: "${date}"
    batchId: "${batchId}"
    ${slots}
  }){
    result
    error
  }
}
`;

/*
  Post hook of addAdhocSession
*/
/* eslint-disable-next-line no-unused-vars */
const addAdhocSessionPostHookMethod = async (input, params, mutationName, context) => {
  const batchId = get(params, 'batchConnectId');
  // const topicId = get(params, 'topicConnectId');
  let courseId = get(params, 'courseConnectId');
  const { id: adhocSessionId } = input;
  const addAdhocInput = get(params, 'input', {});
  const { bookingDate, ...slots } = addAdhocInput;
  /*
    get Course Id
  */
  if (!courseId) {
    const courseResult = await callLocalGraphqlApi(getCourseQuery());
    const course = get(courseResult, 'data.courses');
    if (course.length <= 0) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'Published course is not present with title as python from component addBatchPostHookMethod',
        },
      });
    }
    courseId = course[0].id;
  }

  /*
    get batch info
  */
  const batchResult = await callLocalGraphqlApi(getBatchQuery(batchId));
  const batchInfo = get(batchResult, 'data.batch');
  const { students } = batchInfo;

  // add students to the adhoc session and mark them absent as default
  if (students && students.length) {
    let pushManyQuery = 'attendance:{ pushMany: [';
    students.forEach((studentElem) => {
      if (studentElem.user && studentElem.user.studentProfile && studentElem.user.studentProfile.id) {
        pushManyQuery += `{studentConnectId: "${studentElem.user.studentProfile.id}", 
                                               isPresent: false, 
                                               }, `;
      }
    });
    pushManyQuery += ']}';
    // pushing new array of students in adhoc session
    await callLocalGraphqlApi(updateAdhocSessionQuery(
      adhocSessionId,
      pushManyQuery,
    ));
  }

  const inputSlotTimeArray = getSelectedSlotsTime(slots);
  // fetch batch session for same date and slot
  const batchSessionsRes = await callLocalGraphqlApi(getBatchSessions(batchId, bookingDate, inputSlotTimeArray[0]));
  const batchSessions = get(batchSessionsRes, 'data.batchSessions', []);
  if (batchSessions.length > 0) {
    // if exists, call shiftBatchSessions mutation for same date and slot (this will delete that batch session and shift the others by one)
    const { filteredSlotsString } = extractSlotsFromInput(slots);
    await callLocalGraphqlApi(shiftBatchSessionsAfterGivenDate(bookingDate, batchId, filteredSlotsString));
    log('****** Finished shifting topics in batch sessions');
  }

  log('****** Finished updates');
};

export default addAdhocSessionPostHookMethod;
