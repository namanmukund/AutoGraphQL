import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  componentTypes,
  enrollmentTypes,
  GLOBAL_COURSE_ID,
} from '../../../../constants';
import { ComponentLockedError } from '../../../../constants/errors';

const userLoMethod = async (params) => {
  // userLo collection is used to store and get chat and pq page info
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
    const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatuses(filter:{
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
              currentComponentType
              enrollmentType
            }
          }
          `;
    const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
    const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');
    if (learningObjectiveInfo && topicInfo && currentComponentInfo) {
      let isUnlocked = false;
      const {
        order: topicOrder,
        isTrial,
      } = topicInfo;
      const {
        currentTopic,
        currentLearningObjective,
        currentComponentType,
        enrollmentType,
      } = currentComponentInfo;
      // same logic as that of User chat dump
      if ((enrollmentType === enrollmentTypes.pro &&
        topicOrder <= currentTopic.order
      ) || (enrollmentType === enrollmentTypes.free
        && topicOrder <= currentTopic.order &&
        isTrial === true)) {
        if (topicOrder < currentTopic.order ||
          (currentComponentType === componentTypes.quiz) ||
          (currentComponentType !== componentTypes.video &&
            learningObjectiveOrder <= currentLearningObjective.order)) {
          isUnlocked = true;
        }
      }
      if (!isUnlocked) throw new ComponentLockedError();
    }
  }
};

export default userLoMethod;
