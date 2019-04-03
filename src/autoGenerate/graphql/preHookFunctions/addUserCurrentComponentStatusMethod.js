import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  InvalidTopicLOConnectionError,
  RelationValuesExistError,
} from '../../../../constants/errors';

const addUserCurrentComponentStatusMethod = async (params) => {
  const userId = get(params, 'userConnectId');
  const courseId = get(params, 'currentCourseConnectId');
  const topicId = get(params, 'currentTopicConnectId');
  const learningObjectiveId = get(params, 'currentLearningObjectiveConnectId');
  if (userId && courseId) {
    const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
    const userCurrentComponentStatusData = await callGraphqlApi(
      userCurrentComponentStatusQuery);
    const userCurrentComponentStatusesResult = get(
      userCurrentComponentStatusData,
      'data.userCurrentComponentStatuses');
    // checking if course and user document already exists
    if (userCurrentComponentStatusesResult && userCurrentComponentStatusesResult.length) {
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

export default addUserCurrentComponentStatusMethod;
