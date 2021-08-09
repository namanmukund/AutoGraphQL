import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  sessionStatus,
  TBA,
} from '../../../../constants';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import updateBatchCurrentComponentStatus from './utils/updateBatchCurrentComponentStatus';
import addMentorMenteeSessionForBatch from '../../utils/addMentorMenteeSessionForBatch';
import { DatabaseRecordNotFoundError } from '../../../../constants/errors';
import extractBatchSessionAndSendB2BC from './utils/extractBatchSessionAndSendB2BC';
import addSessionLog from './utils/addSessionLog';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';

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

// query to get published topic list
const nextTopicQuery = (courseId) => `
  query{
  topics(
    filter:{
      and:[
        {
          status: ${PUBLISHED}
        }
        {
          courses_some:{
            ${courseId ? `id: "${courseId}"` : `title: "${GLOBAL_COURSE_TITLE}"`}
          }
        }
      ]
    }
    orderBy:order_ASC,
  ){
    id
  }
}
  `;

// mutation to update batch sessions
const updateBatchSessionQuery = (
  batchSessionId, pushManyQuery,
) => `
  mutation{
    updateBatchSession(id:"${batchSessionId}",  input:{
      ${pushManyQuery}
    }){
      id
    }
  }
  `;

/*
  Post hook of addBatchSession
*/
const addBatchSessionPostHookMethod = async (input, params, mutationName, context) => {
  const batchId = get(params, 'batchConnectId');
  const topicId = get(params, 'topicConnectId');
  let courseId = get(params, 'courseConnectId');
  const mentorSessionConnectId = get(params, 'mentorSessionConnectId');
  const { id: batchSessionId } = input;
  const { bookingDate, sessionStatus: sessionStatusFromInput, ...slots } = params && params.input;
  const { slotTimeArray, currentUser } = context;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

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
  const { students, currentComponent, code } = batchInfo;
  const batchCurrentComponentId = currentComponent && currentComponent.id;
  const currentComponentTopicId = get(currentComponent, 'currentTopic.id');

  // logic to change current component status if topic is completed
  if (batchCurrentComponentId && sessionStatusFromInput && topicId && topicId === currentComponentTopicId) {
    if (sessionStatusFromInput === sessionStatus.completed) {
      /*
      We are getting published topics list through this query.
      Then we will get next published topic
      */
      const nextTopicQueryRes = await callLocalGraphqlApi(nextTopicQuery(courseId));
      const topicsList = get(nextTopicQueryRes, 'data.topics');

      let currentTopicIndex;
      topicsList.forEach((topic, index) => {
        if (topic.id === topicId) {
          currentTopicIndex = index;
        }
      });
      let nextTopicId = '';
      if (currentTopicIndex + 1 < topicsList.length) {
        nextTopicId = topicsList[currentTopicIndex + 1].id;
      }
      await updateBatchCurrentComponentStatus(
        batchCurrentComponentId,
        sessionStatusFromInput,
        nextTopicId,
      );
    } else {
      await updateBatchCurrentComponentStatus(
        batchCurrentComponentId,
        sessionStatusFromInput,
      );
    }
  }

  // add students to the batch session and mark them absent as default
  if (students && students.length && topicId) {
    let pushManyQuery = 'attendance:{ pushMany: [';
    students.forEach((studentElem) => {
      if (studentElem.user && studentElem.user.studentProfile && studentElem.user.studentProfile.id) {
        pushManyQuery += `{studentConnectId: "${studentElem.user.studentProfile.id}", 
                                               isPresent: false, 
                                               }, `;
      }
    });
    pushManyQuery += ']}';
    // pushing new array of students in batch session
    await callLocalGraphqlApi(updateBatchSessionQuery(
      batchSessionId,
      pushManyQuery,
    ));
  }
  const studentsId = (students && students.length) ? students.map((student) => get(student, 'id')) : [];
  extractBatchSessionAndSendB2BC(batchSessionId, studentsId, context.appName === TBA);

  // call addMentorMenteeSessionFor batch to create mentorMenteesession for each student in batch
  if (topicId && mentorSessionConnectId) {
    // eslint-disable-next-line no-restricted-syntax
    for (const student of students) {
      if (student.user && student.user.id) {
        addMentorMenteeSessionForBatch(
          student.user.id,
          '',
          topicId,
          bookingDate,
          slotTimeArray[0],
          mentorSessionConnectId,
          courseId,
          sessionStatusFromInput || sessionStatus.allotted,
          student.user.source,
        );
      }
    }
  }

  if (topicId) {
    // update session log entry
    addSessionLog(bookingDate, slotTimeStringArray, '', topicId, currentUser, courseId, 'addBatchSession', code, mentorSessionConnectId, sessionStatusFromInput || sessionStatus.allotted);
  }
};

export default addBatchSessionPostHookMethod;
