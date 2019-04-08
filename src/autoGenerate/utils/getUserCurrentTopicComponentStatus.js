import { GLOBAL_COURSE_ID, PUBLISHED } from '../../../constants';
import callGraphqlApi from '../../api/callGraphqlApi';

// mutation to add userCurrentTopicComponentStatus
// query to get current topic component status so that we can change the next component accordingly
const userCurrentTopicComponentStatusQuery = async (
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

// mutation to create current component status of user
const getUserCurrentTopicComponentStatus = async (
  userId,
  currentTopic,
  currentLearningObjective,
  enrollmentType,
) => {
  const userCurrentTopicComponentStatusResult =
    await callGraphqlApi(await userCurrentTopicComponentStatusQuery(
      userId,
      currentTopic,
      currentLearningObjective,
      enrollmentType));
  return userCurrentTopicComponentStatusResult;
};

export default getUserCurrentTopicComponentStatus;
