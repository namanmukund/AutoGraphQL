import { GLOBAL_COURSE_TITLE, PUBLISHED } from '../../../constants';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';

// query to get current topic component status
const userCurrentTopicComponentStatusQuery = (
  courseId,
  userId,
  currentTopic,
  currentLearningObjective,
  enrollmentType,
) => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {currentCourse_some:{
        ${courseId ? `id: "${courseId}"` : `and:[ {status: ${PUBLISHED}}, {title: "${GLOBAL_COURSE_TITLE}""}]`}
      }}
      ]
    }){
      id
      ${currentTopic}
      ${currentLearningObjective}
      ${enrollmentType}
      currentTopicComponentType
      skillsLevel
      currentBlockBasedProject{
        id
        order
      }
    }
  }
  `;

// query to get current topic component status
const getUserCurrentTopicComponentStatusForNewCourse = (
  courseId,
  userId,
  currentTopic,
  currentLearningObjective,
  enrollmentType,
) => callLocalGraphqlApi(userCurrentTopicComponentStatusQuery(
  courseId,
  userId,
  currentTopic,
  currentLearningObjective,
  enrollmentType,
));

export default getUserCurrentTopicComponentStatusForNewCourse;
