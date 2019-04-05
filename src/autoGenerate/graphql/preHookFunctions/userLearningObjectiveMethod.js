import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  enrollmentTypes,
  GLOBAL_COURSE_ID,
} from '../../../../constants';
import { ComponentLockedError } from '../../../../constants/errors';

const userLearningObjectiveMethod = async (params) => {
  // userLearningObjective collection is used to store and get chat and pq page info
  // checking if called lo and user combination in accessible
  const filterArray = get(params, 'filter.and');
  const userSome = filterArray.find(obj => obj.user_some);
  const loSome = filterArray.find(obj => obj.learningObjective_some);
  const userId = get(userSome, 'user_some.id');
  const learningObjectiveId = get(loSome, 'learningObjective_some.id');
  if (userId && learningObjectiveId) {
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
    const learningObjectiveQueryRes = await callGraphqlApi(learningObjectiveQuery);
    const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
    const topicInfo = get(learningObjectiveInfo, 'topic');
    const learningObjectiveOrder = get(learningObjectiveInfo, 'order');
    // query to get current component status of user
    const userCurrentTopicComponentStatusQuery = `
          query{
            userCurrentTopicComponentStatuses(filter:{
              and:[
                {user_some:{
                id:"${userId}"
                }},
              {currentCourse_some:{
                and:[
                  {status: published},
                  {id:"${GLOBAL_COURSE_ID}"}
                  {chapters_some:{
                    status: published
                  }}
                ]
              }}
              ]
            }){
              id
              user{
                id
                username
              }
              currentTopic{
                id
                order
              }
              currentLearningObjective{
                id
                order
              }
              currentTopicComponentType
              enrollmentType
            }
          }
          `;
    const userCurrentTopicComponentStatusRes =
      await callGraphqlApi(userCurrentTopicComponentStatusQuery);
    const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');
    if (learningObjectiveInfo && topicInfo && currentTopicComponentInfo) {
      let isUnlocked = false;
      const {
        order: topicOrder,
        isTrial,
      } = topicInfo;
      const {
        currentTopic,
        currentLearningObjective,
        currentTopicComponentType,
        enrollmentType,
      } = currentTopicComponentInfo;
      // same logic as that of User chat dump
      if ((enrollmentType === enrollmentTypes.pro &&
        topicOrder <= currentTopic.order
      ) || (enrollmentType === enrollmentTypes.free
        && topicOrder <= currentTopic.order &&
        isTrial === true)) {
        if (topicOrder < currentTopic.order ||
          (currentTopicComponentType === topicTypes.quiz) ||
          (currentTopicComponentType !== topicTypes.video &&
            learningObjectiveOrder <= currentLearningObjective.order)) {
          isUnlocked = true;
        }
      }
      if (!isUnlocked) throw new ComponentLockedError();
    }
  }
};

export default userLearningObjectiveMethod;
