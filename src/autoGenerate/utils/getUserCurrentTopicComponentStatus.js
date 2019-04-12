import { GLOBAL_COURSE_ID, PUBLISHED } from '../../../constants';
import callGraphqlApi from '../../api/callGraphqlApi';

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
          {id:"${GLOBAL_COURSE_ID}"}
        ]
      }}
      ]
    }){
      id
      ${currentTopic}
      ${currentLearningObjective}
      ${enrollmentType}
      currentTopicComponentType
    }
  }
  `;

// query to get current topic component status
const getUserCurrentTopicComponentStatus = async (
  userId,
  currentTopic,
  currentLearningObjective,
  enrollmentType,
) => {
  const userCurrentTopicComponentStatusResult =
    await callGraphqlApi(userCurrentTopicComponentStatusQuery(
      userId,
      currentTopic,
      currentLearningObjective,
      enrollmentType));
  return userCurrentTopicComponentStatusResult;
};

export default getUserCurrentTopicComponentStatus;
