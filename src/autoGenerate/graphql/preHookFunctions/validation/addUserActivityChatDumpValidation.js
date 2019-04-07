import { get } from 'lodash';
import callGraphqlApi from '../../../../api/callGraphqlApi';
import {
  topicTypes,
  GLOBAL_COURSE_ID, PUBLISHED,
} from '../../../../../constants';
import {
  ComponentLockedError, DatabaseRecordNotFoundError,
  UserOrLearningObjectiveNotPresentError,
} from '../../../../../constants/errors';
import isTopicUnlocked from '../../../utils/isTopicUnlocked';

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

// preehook logic to check if requested chat(user and LO id) is unlocked
const addUserActivityChatDumpValidation = async (params) => {
  // check if the called user and topic is unlocked
  const {
    userConnectId: userId,
    learningObjectiveConnectId: learningObjectiveId,
  } = params;
  if (!userId || !learningObjectiveId) {
    throw new UserOrLearningObjectiveNotPresentError();
  }
  const learningObjectiveQueryRes = await callGraphqlApi(
    await learningObjectiveQuery(learningObjectiveId));
  const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
  const {
    topic: topicInfo,
    order: learningObjectiveOrder,
  } = learningObjectiveInfo;
  const userCurrentTopicComponentStatusRes =
      await callGraphqlApi(await userCurrentTopicComponentStatusQuery(userId));
  const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');
  if (!learningObjectiveInfo) {
    throw new DatabaseRecordNotFoundError('LearningObjective: ');
  }
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
    currentLearningObjective,
    currentTopicComponentType,
    enrollmentType,
  } = currentTopicComponentInfo;
  if (!currentTopic) {
    throw new DatabaseRecordNotFoundError('CurrentTopicComponentInfo.CurrentTopic: ');
  }
  if (!currentLearningObjective) {
    throw new DatabaseRecordNotFoundError('CurrentTopicComponentInfo.CurrentLearningObjective: ');
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
  /*
  condition to check if chat can be accessed:
  if called topic order is less than current topic order or
  other case is when called topic order is equal to current topic order
  in that case we are checking current component type and lo order
  */
  if (!isTopicUnlocked(enrollmentType, currentTopicOrder, topicOrder, isTrial)) {
    throw new ComponentLockedError();
  }
  // will remove commented code after review and testing
  // if (topicOrder < currentTopic.order ||
  //   (currentTopicComponentType === topicTypes.quiz) ||
  //   (currentTopicComponentType !== topicTypes.video &&
  //     learningObjectiveOrder <= currentLearningObjective.order)) {
  //   isUnlocked = true;
  // }
  /*
  code will only reach here in case if passed topic order
   is less than or equal to current topic order
  Here we are checking the case when passed topic order and current topic order are equal
  and passed LO order is greater than current LO order or
  both LO order are equal and current component type is video
  For all above cases we will throw locked error
  */
  const { order: currentLearningObjectiveOrder } = currentLearningObjective;
  if (topicOrder === currentTopicOrder &&
    (learningObjectiveOrder > currentLearningObjectiveOrder ||
      (learningObjectiveOrder === currentLearningObjectiveOrder &&
        currentTopicComponentType === topicTypes.video
      )
    )
  ) {
    throw new ComponentLockedError();
  }


  return true;
};

export default addUserActivityChatDumpValidation;
