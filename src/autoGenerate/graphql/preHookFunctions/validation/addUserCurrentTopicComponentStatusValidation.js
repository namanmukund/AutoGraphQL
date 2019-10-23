import { get } from 'lodash';
import callGraphqlApi from '../../../../api/callGraphqlApi';
import {
  InvalidTopicLOConnectionError, TopicOrLONotPresentError,
  UserCourseCombinationExistError, UserMismatchError, UserOrCourseNotPresentError,
} from '../../../../../constants/errors';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import { backendApps } from '../../../../../constants';

// query to get userCurrentTopicComponentStatus for given user and course id
const userCurrentTopicComponentStatusQuery = (userId, courseId) => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {currentCourse_some:{
          id:"${courseId}"
      }}
      ]
    }){
      id
    }
  }
`;

// query to get topic and LO meta provided in input
const learningObjectiveQuery = (topicId, learningObjectiveId) => `
  query{
    topic(id:"${topicId}"){
      id
      learningObjectivesMeta(filter:{
        id:"${learningObjectiveId}"
      }){
        count
      }
    }
  }
  `;

/*
Pre hook contains logic to check if provided user and course combination does not exist and
logic to check if topic and LO passed are related to each other
*/
const addUserCurrentTopicComponentStatusValidation = async (params, context) => {
  /*
  Calling method to validate token and return userId and appName
  we will compare this userId against userId passed in input
  both should be equal to perform further action
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    userIdFromContext,
    appName,
  } = userAndAppInfo;
  const {
    userConnectId: userId,
    currentCourseConnectId: courseId,
    currentTopicConnectId: topicId,
    currentLearningObjectiveConnectId: learningObjectiveId,
  } = params;
  if (!userId || !courseId) {
    throw new UserOrCourseNotPresentError();
  }
  if (!backendApps.includes(appName) && userIdFromContext !== userId) {
    throw new UserMismatchError();
  }
  // logic to check if lo and topic passed are related to each other
  if (!topicId || !learningObjectiveId) {
    throw new TopicOrLONotPresentError();
  }
  const userCurrentTopicComponentStatusData = await callGraphqlApi(
    userCurrentTopicComponentStatusQuery(userId, courseId),
  );
  // Fetching userCurrentTopicComponentStatus to check if it already exists or not
  const userCurrentTopicComponentStatusesResult = get(
    userCurrentTopicComponentStatusData,
    'data.userCurrentTopicComponentStatuses',
  );
    // checking if course and user document already exists
  if (userCurrentTopicComponentStatusesResult && userCurrentTopicComponentStatusesResult.length) {
    throw new UserCourseCombinationExistError();
  }
  /*
  this query returns the count of the learning objective id inside topic id
  So, basically it returns 1 if LO and topic are related otherwise 0
  */
  const learningObjectiveData = await callGraphqlApi(
    learningObjectiveQuery(topicId, learningObjectiveId),
  );
  const learningObjectiveCount = get(
    learningObjectiveData,
    'data.topic.learningObjectivesMeta.count',
  );
  /*
  if learning objective count is not present or the count is less than 1
  that means LO and topic are not related to each other
  */
  if (!learningObjectiveCount || learningObjectiveCount < 1) {
    throw new InvalidTopicLOConnectionError();
  }
  return true;
};

export default addUserCurrentTopicComponentStatusValidation;
