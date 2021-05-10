import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  sessionStatus,
} from '../../../../constants';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import updateBatchCurrentComponentStatus from './utils/updateBatchCurrentComponentStatus';
import addMentorMenteeSessionForBatch from '../../utils/addMentorMenteeSessionForBatch';

// query to get chapters and topics belomngin to a course
const getCourseQuery = () => `
    query{
      courses(filter:{
        and:[
          {title: ${GLOBAL_COURSE_TITLE}},
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
        students{
          user{
            id
            source
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
const nextTopicQuery = () => `
  query{
  topics(
    filter:{
      status: ${PUBLISHED}
    }
    orderBy:order_ASC,
  ){
    id
  }
}
  `;

/*
  Post hook of addBatchSession
*/
const updateBatchSessionPostHookMethod = async (input, params, mutationName, context) => {
  const { sessionStatus: sessionStatusFromInput } = input;
  const {
    slotTimeArray,
    topicId,
    batchId,
    bookingDate,
    mentorSessionConnectId,
    bookingDateFromInput,
  } = context;
  /*
    get Course Id
  */
  const courseResult = await callLocalGraphqlApi(getCourseQuery());
  const course = get(courseResult, 'data.courses');
  if (course.length <= 0) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Published course is not present with title as python from component addBatchPostHookMethod',
      },
    });
  }
  const { id: courseId } = course[0];

  /*
    get batch info
  */
  const batchResult = await callLocalGraphqlApi(getBatchQuery(batchId));
  const batchInfo = get(batchResult, 'data.batch');
  const { students, currentComponent } = batchInfo;
  const batchCurrentComponentId = currentComponent && currentComponent.id;
  const currentComponentTopicId = get(currentComponent, 'currentTopic.id');

  // logic to change current component status if topic is completed
  if (batchCurrentComponentId && sessionStatusFromInput && topicId === currentComponentTopicId) {
    if (sessionStatusFromInput === sessionStatus.completed) {
      /*
      We are getting published topics list through this query.
      Then we will get next published topic
      */
      const nextTopicQueryRes = await callLocalGraphqlApi(nextTopicQuery());
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
        sessionStatus.allotted,
        nextTopicId,
      );
    } else {
      await updateBatchCurrentComponentStatus(
        batchCurrentComponentId,
        sessionStatusFromInput,
      );
    }
  }

  // call addMentorMenteeSessionFor batch to create mentorMenteesession for each student in batch
  // this should only happen if we are changing sessionStatus or bookingDateFromInput
  if ((sessionStatusFromInput && sessionStatusFromInput !== sessionStatus.allotted) || bookingDateFromInput) {
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
          'updateBatchSession',
        );
      }
    }
  }
};

export default updateBatchSessionPostHookMethod;
