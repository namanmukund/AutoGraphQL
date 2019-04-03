import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  componentTypes,
  enrollmentTypes,
  GLOBAL_COURSE_ID,
} from '../../../../constants';
import { ComponentLockedError } from '../../../../constants/errors';

const userQuizMethod = async (params) => {
  // check if the called user and topic is unlocked
  const userId = get(params, 'userConnectId');
  const topicId = get(params, 'topicConnectId');
  if (userId && topicId) {
    const topicQuery = `
          query{
            topic(id:"${topicId}"){
              id
              isTrial
              order
            }
          }
          `;
    const topicQueryRes = await callGraphqlApi(topicQuery);
    const topicInfo = get(topicQueryRes, 'data.topic');
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
              currentComponentType
              enrollmentType
            }
          }
          `;
    const userCurrentComponentStatusRes = await callGraphqlApi(userCurrentComponentStatusQuery);
    const currentComponentInfo = get(userCurrentComponentStatusRes, 'data.userCurrentComponentStatuses[0]');
    if (topicInfo && currentComponentInfo) {
      let isUnlocked = false;
      const {
        order: topicOrder,
        isTrial,
      } = topicInfo;
      const {
        currentTopic,
        currentComponentType,
        enrollmentType,
      } = currentComponentInfo;
      // logic same as that of User quiz dump
      if ((enrollmentType === enrollmentTypes.pro &&
        topicOrder <= currentTopic.order
      ) || (enrollmentType === enrollmentTypes.free
        && topicOrder <= currentTopic.order &&
        isTrial === true)) {
        if (topicOrder < currentTopic.order ||
          (currentComponentType === componentTypes.quiz)) {
          isUnlocked = true;
        }
      }
      if (!isUnlocked) throw new ComponentLockedError();
    }
  }
};

export default userQuizMethod;
