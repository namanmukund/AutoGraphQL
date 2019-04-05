import { get } from 'lodash';
import callGraphqlApi from '../../../../api/callGraphqlApi';
import {
  InvalidTopicLOConnectionError,
  UserCourseCombinationExistError,
} from '../../../../../constants/errors';

// query to get userCurrentTopicComponentStatus for given user and course id
const userCurrentTopicComponentStatusQuery = async (userId, courseId) => `
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
const learningObjectiveQuery = async (topicId, learningObjectiveId) => `
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
Pre hook logic to check if provided user and course combination does not exist
logic to check if topic and LO passed are related to each other
*/
const addUserCurrentTopicComponentStatusValidation = async (params) => {
  const userId = get(params, 'userConnectId');
  const courseId = get(params, 'currentCourseConnectId');
  const topicId = get(params, 'currentTopicConnectId');
  const learningObjectiveId = get(params, 'currentLearningObjectiveConnectId');
  if (userId && courseId) {
    const userCurrentTopicComponentStatusData = await callGraphqlApi(
      await userCurrentTopicComponentStatusQuery(userId, courseId));
    const userCurrentTopicComponentStatusesResult = get(
      userCurrentTopicComponentStatusData,
      'data.userCurrentTopicComponentStatuses');
    // checking if course and user document already exists
    if (userCurrentTopicComponentStatusesResult && userCurrentTopicComponentStatusesResult.length) {
      throw new UserCourseCombinationExistError();
    }
    // logic to check if lo and topic passed are related to each other
    if (topicId && learningObjectiveId) {
      const learningObjectiveData = await callGraphqlApi(
        await learningObjectiveQuery(topicId, learningObjectiveId));
      const learningObjectiveCount = get(
        learningObjectiveData,
        'data.topic.learningObjectivesMeta.count');
      if (learningObjectiveCount && learningObjectiveCount > 0) {
        throw new InvalidTopicLOConnectionError();
      }
    }
  }
};

export default addUserCurrentTopicComponentStatusValidation;
