import { get } from 'lodash';
import callGraphqlApi from '../../../../api/callGraphqlApi';
import {
  enrollmentTypes,
  GLOBAL_COURSE_ID,
} from '../../../../../constants';
import { ComponentLockedError } from '../../../../../constants/errors';

// query to get topic order info
const topicQuery = async topicId => `
  query{
    topic(id:"${topicId}"){
      id
      order
      isTrial
    }
  }
  `;

// query to get current component status of user
const userCurrentTopicComponentStatusQuery = async userId => `
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
      currentTopicComponentType
      enrollmentType
    }
  }
  `;

// preehook logic to check if requested video(user and topic id) is unlocked
const addUserActivityVideoDumpValidation = async (params) => {
  // check if the called user and topic is unlocked
  const userId = get(params, 'userConnectId');
  const topicId = get(params, 'topicConnectId');
  if (userId && topicId) {
    const topicQueryRes = await callGraphqlApi(await topicQuery(topicId));
    const topicInfo = get(topicQueryRes, 'data.topic');
    const userCurrentTopicComponentStatusRes =
      await callGraphqlApi(await userCurrentTopicComponentStatusQuery(userId));
    const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');

    if (topicInfo && currentTopicComponentInfo) {
      let isUnlocked = false;
      const {
        order,
        isTrial,
      } = topicInfo;
      const {
        currentTopic,
        enrollmentType,
      } = currentTopicComponentInfo;
      // condition to check if topic is free, if not then user should be pro
      // type to access that topic
      if ((enrollmentType === enrollmentTypes.pro &&
        order <= currentTopic.order
      ) || (enrollmentType === enrollmentTypes.free
        && order <= currentTopic.order &&
        isTrial === true)
      ) {
        isUnlocked = true;
      }
      // throwing component is locked error
      if (!isUnlocked) throw new ComponentLockedError();
    }
  }
};

export default addUserActivityVideoDumpValidation;
