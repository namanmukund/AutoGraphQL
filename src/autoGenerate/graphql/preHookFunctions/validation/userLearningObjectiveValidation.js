import { get } from 'lodash';
import callGraphqlApi from '../../../../api/callGraphqlApi';
import {
  topicTypes,
  enrollmentTypes,
  GLOBAL_COURSE_ID,
} from '../../../../../constants';
import { ComponentLockedError } from '../../../../../constants/errors';

// query to get learning objective and it's topic order info
const learningObjectiveQuery = async learningObjectiveId => `
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
      currentLearningObjective{
        id
        order
      }
      currentTopicComponentType
      enrollmentType
    }
  }
  `;

// preehook logic to check if requested UserLO(user and LO id) is unlocked
const userLearningObjectiveValidation = async (params) => {
  // userLearningObjective collection is used to store and get chat and pq page info
  // checking if called lo and user combination in accessible
  const filterArray = get(params, 'filter.and');
  const userSome = filterArray.find(obj => obj.user_some);
  const loSome = filterArray.find(obj => obj.learningObjective_some);
  const userId = get(userSome, 'user_some.id');
  const learningObjectiveId = get(loSome, 'learningObjective_some.id');
  if (userId && learningObjectiveId) {
    const learningObjectiveQueryRes = await callGraphqlApi(
      await learningObjectiveQuery(learningObjectiveId));
    const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
    const { topic: topicInfo, order: learningObjectiveOrder } = learningObjectiveInfo;
    const userCurrentTopicComponentStatusRes =
      await callGraphqlApi(await userCurrentTopicComponentStatusQuery(userId));
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

export default userLearningObjectiveValidation;
