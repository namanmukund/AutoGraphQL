import { GLOBAL_COURSE_TITLE, PUBLISHED } from '../../../constants';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';

// query to get current topic component status
const userCurrentTopicComponentStatusQuery = (
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
        and:[
          {status: ${PUBLISHED}},
          {title: "${GLOBAL_COURSE_TITLE}"}
        ]
      }}
      ]
    }){
      id
      ${currentTopic}
      ${currentLearningObjective}
      ${enrollmentType}
      currentTopicComponentType
      skillsLevel
    }
  }
  `;

// query to get current topic component status
const getUserCurrentTopicComponentStatus = (
  userId,
  currentTopic,
  currentLearningObjective,
  enrollmentType,
) => callLocalGraphqlApi(userCurrentTopicComponentStatusQuery(
  userId,
  currentTopic,
  currentLearningObjective,
  enrollmentType,
));

export default getUserCurrentTopicComponentStatus;
