/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  sessionStatus,
  sessionType,
} from '../../../../constants';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import updateBatchCurrentComponentStatus from './utils/updateBatchCurrentComponentStatus';
import addMentorMenteeSessionForBatch from '../../utils/addMentorMenteeSessionForBatch';
import { DatabaseRecordNotFoundError } from '../../../../constants/errors';
import extractBatchSessionAndSendB2BC from './utils/extractBatchSessionAndSendB2BC';
import extractBatchSessionAndSendB2B from './utils/extractBatchSessionAndSendB2B';
import addSessionLog from './utils/addSessionLog';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import isTrialSession from '../resolvers/utils/isTrialSession';
import mentorAvailabilitySlotOperation from './utils/mentorAvailabilitySlotOperation';
import { getMentorProfileFromMentorSession } from './utils/getMentorProfile';
import generateOtpForBatchSession from './utils/generateOtpForBatchSession';
import getSlotDifference from './utils/getTimeDifference';
import { getTopicsFromCoursePackage } from './utils/updateBatchPostHookQueries';
import getSortedTopics from '../../../../utils/getSortedTopicsFromCoursePackageOrder';

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
        type
        students{
          id
          section
          grade
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
  UPDATED LOGIC:
  - if coursePackageConnectId is present in params, update current component to reflect next topic from coursePackage, not course
*/
const addBatchSessionPostHookMethod = async (input, params, mutationName, context) => {
  const batchId = get(params, 'batchConnectId');
  const topicId = get(params, 'topicConnectId');
  let courseId = get(params, 'courseConnectId');
  const coursePackageId = get(params, 'coursePackageConnectId');
  const mentorSessionConnectId = get(params, 'mentorSessionConnectId');
  const { id: batchSessionId } = input;
  const { bookingDate, sessionStatus: sessionStatusFromInput, ...slots } = params && params.input;
  const { slotTimeArray, currentUser } = context;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  /*
    get Course Id
  */
  if (!courseId && !coursePackageId) {
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
  const isTrial = await isTrialSession(get(input, 'topic.typeId'));
  const batchType = get(batchResult, 'data.batch.type');
  if (isTrial) {
    let mentorProfile;
    if (mentorSessionConnectId) {
      mentorProfile = await getMentorProfileFromMentorSession(mentorSessionConnectId);
    }
    await mentorAvailabilitySlotOperation({
      slotTimeStringArray,
      date: get(input, 'bookingDate'),
      mutationName,
      sessionType: sessionType.trial,
      sessionId: batchSessionId,
      mentorProfileId: get(mentorProfile, 'user.mentorProfile.id'),
      batchType,
    });
  }
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
      let topicsList = [];
      if (coursePackageId) {
        const coursePackage = await getTopicsFromCoursePackage(coursePackageId);
        const topicRules = get(coursePackage, 'topics');
        topicsList = getSortedTopics(topicRules);
      } else {
        const nextTopicQueryRes = await callLocalGraphqlApi(nextTopicQuery(courseId));
        topicsList = get(nextTopicQueryRes, 'data.topics');
      }

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
        context,
      );
    } else {
      await updateBatchCurrentComponentStatus(
        batchCurrentComponentId,
        sessionStatusFromInput,
        null,
        context,
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
    context.fromAddBatchSession = true;
    // pushing new array of students in batch session
    await callLocalGraphqlApi(updateBatchSessionQuery(
      batchSessionId,
      pushManyQuery,
    ), context);
  }
  const isBetweenTwoHrs = getSlotDifference(get(slotTimeStringArray, '[0]'), bookingDate, 2);
  // if (isBetweenTwoHrs && batchType === 'b2b') generateOtpForBatchSession(batchSessionId, students);
  const studentsId = (students && students.length) ? students.map((student) => get(student, 'id')) : [];
  extractBatchSessionAndSendB2BC(batchSessionId, studentsId, false);
  extractBatchSessionAndSendB2B(batchSessionId);

  // call addMentorMenteeSessionFor batch to create mentorMenteesession for each student in batch
  // mentorSessionConnectId made non-mandatory
  // if (topicId) {
  // eslint-disable-next-line no-restricted-syntax
  //   for (const student of students) {
  //     if (student.user && student.user.id) {
  //       addMentorMenteeSessionForBatch(
  //         context,
  //         student.user.id,
  //         '',
  //         topicId,
  //         bookingDate,
  //         slotTimeArray[0],
  //         mentorSessionConnectId,
  //         courseId,
  //         sessionStatusFromInput || sessionStatus.allotted,
  //         student.user.source,
  //       );
  //     }
  //   }
  // }

  if (topicId) {
    // update session log entry
    addSessionLog(bookingDate, slotTimeStringArray, '', topicId, currentUser, courseId, 'addBatchSession', code, mentorSessionConnectId, sessionStatusFromInput || sessionStatus.allotted, '', get(context, 'isManualSession', false));
  }
};

export default addBatchSessionPostHookMethod;
