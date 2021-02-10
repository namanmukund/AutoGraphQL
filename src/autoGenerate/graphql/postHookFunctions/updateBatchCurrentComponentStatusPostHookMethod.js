import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  sessionStatus,
} from '../../../../constants';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import addMentorMenteeSessionForBatch from '../../utils/addMentorMenteeSessionForBatch';

// query to topics between 2 orders
const getTopicSList = (topicStartOrder, topicEndOrder) => `
    query{
      topics(filter:{
        and: [
          {
            order_gte: ${topicStartOrder}
          },
          {
            order_lt: ${topicEndOrder}
          }
        ]
      }){
        id
        order
      }
    }
  `;

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

/*
  This method adds mentor mentee session for each student in batch for each topic when topic is set
*/
const updateBatchCurrentComponentStatusPostHookMethod = async (input, params, mutationName, context) => {
  const {
    batchCurrentComponentStatusDoc,
    topicDoc,
  } = context;
  const studentsList = get(batchCurrentComponentStatusDoc, 'batch.students');
  const mentorId = get(batchCurrentComponentStatusDoc, 'batch.allottedMentor.id');
  const topicStartOrder = get(batchCurrentComponentStatusDoc, 'currentTopic.order');
  const topicEndOrder = get(topicDoc, 'order');

  if (studentsList && studentsList.length && topicStartOrder && topicEndOrder && topicEndOrder > topicStartOrder) {
    const topicsListResult = await callLocalGraphqlApi(getTopicSList(topicStartOrder, topicEndOrder));
    const topicsList = get(topicsListResult, 'data.topics');
    if (topicsList && topicsList.length) {
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
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0);
      // call addMentorMenteeSessionFor batch to create mentorMenteesession for each student for each topics
      // eslint-disable-next-line no-restricted-syntax
      for (const student of studentsList) {
        // eslint-disable-next-line no-restricted-syntax
        for (const topic of topicsList) {
          if (student.user && student.user.id && topic && topic.id) {
            // eslint-disable-next-line no-await-in-loop
            await addMentorMenteeSessionForBatch(
              student.user.id,
              mentorId,
              topic.id,
              date,
              '23',
              '',
              courseId,
              sessionStatus.completed,
              student.user.source,
              'updateBatchCurrentComponentStatus',
            );
          }
        }
      }
    }
  }
};

export default updateBatchCurrentComponentStatusPostHookMethod;
