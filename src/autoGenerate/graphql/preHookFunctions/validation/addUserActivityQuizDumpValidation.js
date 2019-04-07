import { get } from 'lodash';
import callGraphqlApi from '../../../../api/callGraphqlApi';
import {
  topicTypes,
  GLOBAL_COURSE_ID, PUBLISHED,
} from '../../../../../constants';
import {
  ComponentLockedError, DatabaseRecordNotFoundError,
  UserOrTopicNotPresentError,
} from '../../../../../constants/errors';
import isTopicUnlocked from '../../../utils/isTopicUnlocked';

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
          {status: ${PUBLISHED}},
          {id:"${GLOBAL_COURSE_ID}"}
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

// preehook logic to check if requested quiz(user and topic id) is unlocked
const addUserActivityQuizDumpValidation = async (params) => {
  // check if the called user and topic is unlocked
  const {
    userConnectId: userId,
    topicConnectId: topicId,
  } = params;
  if (!userId || !topicId) {
    throw new UserOrTopicNotPresentError();
  }
  const topicQueryRes = await callGraphqlApi(await topicQuery(topicId));
  const topicInfo = get(topicQueryRes, 'data.topic');
  const userCurrentTopicComponentStatusRes =
      await callGraphqlApi(await userCurrentTopicComponentStatusQuery(userId));
  const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');
  if (!topicInfo) {
    throw new DatabaseRecordNotFoundError('LearningObjective.topicInfo: ');
  }
  if (!currentTopicComponentInfo) {
    throw new DatabaseRecordNotFoundError('CurrentTopicComponentInfo: ');
  }
  const {
    order: topicOrder,
    isTrial,
  } = topicInfo;
  const {
    currentTopic,
    currentTopicComponentType,
    enrollmentType,
  } = currentTopicComponentInfo;
  if (!currentTopic) {
    throw new DatabaseRecordNotFoundError('CurrentTopicComponentInfo.CurrentTopic: ');
  }
  if (!currentTopicComponentType) {
    throw new DatabaseRecordNotFoundError('CurrentTopicComponentInfo.CurrentTopicComponentType: ');
  }
  if (!enrollmentType) {
    throw new DatabaseRecordNotFoundError('CurrentTopicComponentInfo.EnrollmentType: ');
  }
  // condition to check if topic is free, if not then user should be pro
  // type to access that topic
  const { order: currentTopicOrder } = currentTopic;
  if (!isTopicUnlocked(enrollmentType, currentTopicOrder, topicOrder, isTrial)) {
    throw new ComponentLockedError();
  }
  // will remove commented code after review and testing
  // if (topicOrder < currentTopic.order ||
  //   (currentTopicComponentType === topicTypes.quiz)) {
  //   isUnlocked = true;
  // }
  /*
      code will only reach here in case if passed topic order
       is less than or equal to current topic order.
      Here we are checking the case when passed topic order and current topic order are equal
      and current component type is not quiz
      For all above cases we will throw locked error
      */
  if (topicOrder === currentTopicOrder &&
        currentTopicComponentType !== topicTypes.quiz
  ) {
    throw new ComponentLockedError();
  }
  return true;
};

export default addUserActivityQuizDumpValidation;
