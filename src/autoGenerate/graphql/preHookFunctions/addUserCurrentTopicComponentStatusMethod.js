import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  InvalidTopicLOConnectionError,
  RelationValuesExistError,
} from '../../../../constants/errors';

const addUserCurrentTopicComponentStatusMethod = async (params) => {
  const userId = get(params, 'userConnectId');
  const courseId = get(params, 'currentCourseConnectId');
  const topicId = get(params, 'currentTopicConnectId');
  const learningObjectiveId = get(params, 'currentLearningObjectiveConnectId');
  if (userId && courseId) {
    const userCurrentTopicComponentStatusQuery = `
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
    const userCurrentTopicComponentStatusData = await callGraphqlApi(
      userCurrentTopicComponentStatusQuery);
    const userCurrentTopicComponentStatusesResult = get(
      userCurrentTopicComponentStatusData,
      'data.userCurrentTopicComponentStatuses');
    // checking if course and user document already exists
    if (userCurrentTopicComponentStatusesResult && userCurrentTopicComponentStatusesResult.length) {
      throw new RelationValuesExistError();
    }
    // logic to check if lo and topic passed are related to each other
    if (topicId && learningObjectiveId) {
      const learningObjectiveQuery = `
          query{
            learningObjective(id:"${learningObjectiveId}"){
              id
              order
              topic{
                id
                order
                isTrial
              }
            }
          }
          `;
      const learningObjectiveData = await callGraphqlApi(
        learningObjectiveQuery);
      const topicIdConnectedToLO = get(
        learningObjectiveData,
        'data.learningObjective.topic.id');
      if (topicIdConnectedToLO && topicIdConnectedToLO !== topicId) {
        throw new InvalidTopicLOConnectionError();
      }
    }
  }
};

export default addUserCurrentTopicComponentStatusMethod;
