import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
} from '../../../../constants';
import { log } from '../../../../utils';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getFirstTopicAndLearningObjective from '../../utils/getFirstTopicAndLearningObjective';
import getSortedTopics from '../../../../utils/getSortedTopicsFromCoursePackageOrder';
import {
  getTopicsFromCoursePackage,
} from './utils/updateBatchPostHookQueries';

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
  isClassroom = false,
) => `
  mutation{
    addBatchCurrentComponentStatus(
      batchConnectId: "${batchId}",
      currentCourseConnectId: "${courseId}",
      currentTopicConnectId: "${topicId}",
      input: {
        latestSessionStatus:allotted
        ${isClassroom ? 'enrollmentType: pro' : ''} 
      }
    ){
      id
    }
  }
  `;

/*
  Post hook of add batch
*/
const addBatchPostHookMethod = async (input, _params, _mutationName, context) => {
  const { id: batchId } = input;
  let courseId = get(input, 'course.typeId');
  const coursePackageId = get(input, 'coursePackage.typeId');
  const documentType = get(input, 'documentType', 'batch');
  const batchStudents = get(_params, 'batchStudentsConnectIds', []);
  let topic;
  let firstTopicId;
  /*
    logic to add current batch component status
    the first published topic will get populated in the document
    */
  if (coursePackageId) {
    const coursePackage = await getTopicsFromCoursePackage(coursePackageId, context);
    const topicRules = get(coursePackage, 'topics');
    const topics = getSortedTopics(topicRules);
    if (courseId) {
      firstTopicId = get((topics || []).find((topicRes) => get(topicRes, 'courses[0].id') === courseId), 'id');
    }
    firstTopicId = firstTopicId || get(topics, '[0].id');
    courseId = courseId || get(topics, '[0].courses[0].id');
  } else {
    topic = await getFirstTopicAndLearningObjective('', courseId);
    firstTopicId = get(topic, 'data.topics[0].id');
  }

  if (!courseId && !coursePackageId) {
    const courseResult = await callLocalGraphqlApi(getCourseQuery(), context);
    const course = get(courseResult, 'data.courses');
    if (course.length <= 0) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error:
            'Published course is not present with title as python from component addBatchPostHookMethod',
        },
      });
    }
    courseId = course[0].id;
  }

  if (batchStudents && batchStudents.length) {
    // Purging Student Profile Cache to avoid data mismatch.
    await callLocalGraphqlApi(`
      query{
        purgeCache(pattern: "userProfile::activeClassroom::*") {
          result
        }
      }
    `, context);
  }
  // we are not throwing any error here because it will seem that create batch failed if
  // firstTopicId and courseId and batchId is not present. Just adding log
  if (batchId && courseId && firstTopicId) {
    await callLocalGraphqlApi(
      addBatchCurrentComponentStatus(
        batchId,
        courseId,
        firstTopicId,
        documentType === 'classroom',
      ),
      context,
    );
  } else {
    log(
      'Failed to get first published topic or published course or batch id corresponding to it in addBatchPostHookMethod',
    );
  }
};

export default addBatchPostHookMethod;
