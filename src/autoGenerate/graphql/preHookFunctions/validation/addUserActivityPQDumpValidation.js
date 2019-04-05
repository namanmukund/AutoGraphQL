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

// preehook logic to check if requested PQ(user and LO id) is unlocked
const addUserActivityPQDumpValidation = async (params) => {
  // check if the called user and topic is unlocked
  const userId = get(params, 'userConnectId');
  const learningObjectiveId = get(params, 'learningObjectiveConnectId');
  if (userId && learningObjectiveId) {
    const learningObjectiveQueryRes = await callGraphqlApi(
      await learningObjectiveQuery(learningObjectiveId));
    const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
    const topicInfo = get(learningObjectiveInfo, 'topic');
    const learningObjectiveOrder = get(learningObjectiveInfo, 'order');
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
          (currentTopicComponentType === topicTypes.quiz) ||
          (currentTopicComponentType !== topicTypes.video &&
            learningObjectiveOrder < currentLearningObjective.order) ||
          (currentTopicComponentType === topicTypes.practiceQuestion &&
            learningObjectiveOrder === currentLearningObjective.order)) {
          isUnlocked = true;
        }
      }
      if (!isUnlocked) throw new ComponentLockedError();
    }
  }
};

export default addUserActivityPQDumpValidation;
