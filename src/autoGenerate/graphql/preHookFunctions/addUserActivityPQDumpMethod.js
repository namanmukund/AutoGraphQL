import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  componentTypes,
  enrollmentTypes,
  GLOBAL_COURSE_ID,
} from '../../../../constants';
import { ComponentLockedError } from '../../../../constants/errors';

const addUserActivityPQDumpMethod = async (params) => {
  // check if the called user and topic is unlocked
  const userId = get(params, 'userConnectId');
  const learningObjectiveId = get(params, 'learningObjectiveConnectId');
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
      // condition to check if topic is free, if not then user should be pro
      // type to access that topic
      if ((enrollmentType === enrollmentTypes.pro &&
        topicOrder <= currentTopic.order
      ) || (enrollmentType === enrollmentTypes.free
        && topicOrder <= currentTopic.order &&
        isTrial === true)) {
        // condition to check if pq can be accessed:
        // if called topic order is less than current topic order or
        // other case is when called topic order is equal to current topic order
        // in that case we are checking current component type and lo order
        if (topicOrder < currentTopic.order ||
          (currentComponentType === componentTypes.quiz) ||
          (currentComponentType !== componentTypes.video &&
            learningObjectiveOrder < currentLearningObjective.order) ||
          (currentComponentType === componentTypes.practiceQuestion &&
            learningObjectiveOrder === currentLearningObjective.order)) {
          isUnlocked = true;
        }
      }
      if (!isUnlocked) throw new ComponentLockedError();
    }
  }
};

export default addUserActivityPQDumpMethod;
