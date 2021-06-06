import { get } from 'lodash';
import {
  enrollmentTypes,
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  topicTypes,
} from '../../../constants';
import { DatabaseRecordNotFoundError } from '../../../constants/errors';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';

const { free } = enrollmentTypes;
const { video } = topicTypes;
// mutation to add userCurrentTopicComponentStatus
const addUserCurrentTopicComponentStatusMutation = (
  userId,
  courseId,
  firstTopicId,
  firstLearningObjectiveId,
) => `
  mutation{
    addUserCurrentTopicComponentStatus(
      input: {
        enrollmentType: ${free}
        currentTopicComponentType: ${video}
      }
      userConnectId:"${userId}"
      currentCourseConnectId:"${courseId}"
      currentTopicConnectId:"${firstTopicId}"
      currentLearningObjectiveConnectId: "${firstLearningObjectiveId}"
    ){
      id
    }
  }
`;

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

// mutation to create current component status of user
const addUserCurrentTopicComponentStatus = async (
  userId,
  firstTopicId,
  firstLearningObjectiveId,
) => {
  const courseResult = await callLocalGraphqlApi(getCourseQuery());
  const course = get(courseResult, 'data.courses');
  if (course.length <= 0) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Published course is not present with title as python',
      },
    });
  }
  const { id: courseId } = course[0];
  await callLocalGraphqlApi(addUserCurrentTopicComponentStatusMutation(
    userId,
    courseId,
    firstTopicId,
    firstLearningObjectiveId,
  ));
};

export default addUserCurrentTopicComponentStatus;
