import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  enrollmentTypes,
  GLOBAL_COURSE_ID,
} from '../../../../constants';
import { ComponentLockedError } from '../../../../constants/errors';

const userVideoMethod = async (params) => {
  // userVideo collection is used to store and get video page info
  // checking if called topic and user combination in accessible
  const filterArray = get(params, 'filter.and');
  const userSome = filterArray.find(obj => obj.user_some);
  const topicSome = filterArray.find(obj => obj.topic_some);
  const userId = get(userSome, 'user_some.id');
  const topicId = get(topicSome, 'topic_some.id');
  if (userId && topicId) {
    const topicQuery = `
          query{
            topic(id:"${topicId}"){
              id
              order
              isTrial
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
        order,
        isTrial,
      } = topicInfo;
      const {
        currentTopic,
        enrollmentType,
      } = currentComponentInfo;
      // logic is same as that of user video dump
      if ((enrollmentType === enrollmentTypes.pro &&
        order <= currentTopic.order
      ) || (enrollmentType === enrollmentTypes.free
        && order <= currentTopic.order &&
        isTrial === true)
      ) {
        isUnlocked = true;
      }
      if (!isUnlocked) throw new ComponentLockedError();
    }
  }
};

export default userVideoMethod;
