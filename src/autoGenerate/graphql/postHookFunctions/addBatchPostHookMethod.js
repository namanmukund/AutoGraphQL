import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
} from '../../../../constants';
import { log } from '../../../../utils';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getFirstTopicAndLearningObjective from '../../utils/getFirstTopicAndLearningObjective';

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

// mutation to add  BatchCurrentComponentStatus
const addBatchCurrentComponentStatus = (
  batchId,
  courseId,
  topicId,
) => `
  mutation{
    addBatchCurrentComponentStatus(
      batchConnectId: "${batchId}",
      currentCourseConnectId: "${courseId}",
      currentTopicConnectId: "${topicId}",
      input: {
        latestSessionStatus:allotted
      }
    ){
      id
    }
  }
  `;

/*
  Post hook of add batch
*/
const addBatchPostHookMethod = async (input) => {
  const { id: batchId } = input;
  let courseId = get(input, 'input.course.typeId');
  /*
    logic to add current batch component status
    the first published topic will get populated in the document
    */
  const topic = await getFirstTopicAndLearningObjective(courseId);
  const firstTopicId = get(topic, 'data.topics[0].id');

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
  // we are not throwing any error here because it will seem that create batch failed if
  // firstTopicId and courseId and batchId is not present. Just adding log
  if (batchId && courseId && firstTopicId) {
    await callLocalGraphqlApi(addBatchCurrentComponentStatus(
      batchId, courseId, firstTopicId,
    ));
  } else {
    log('Failed to get first published topic or published course or batch id corresponding to it in addBatchPostHookMethod');
  }
};

export default addBatchPostHookMethod;
