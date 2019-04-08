import { get } from 'lodash';
import callGraphqlApi from '../../../../api/callGraphqlApi';
import {
  topicTypes,
} from '../../../../../constants';
import {
  ComponentLockedError, DatabaseRecordNotFoundError,
  UserOrLearningObjectiveNotPresentError,
} from '../../../../../constants/errors';
import isTopicUnlocked from '../../../utils/isTopicUnlocked';
import getUserCurrentTopicComponentStatus from '../../../utils/getUserCurrentTopicComponentStatus';

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

// prehook logic to check if requested PQ(user and LO id) is unlocked
const addUserActivityPQDumpValidation = async (params) => {
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
  const currentTopicQuery = `currentTopic{
                                id
                                order
                             }`;
  const currentLearningObjectiveQuery = `currentLearningObjective{
                                            id
                                            order
                                         }`;
  const userCurrentTopicComponentStatusRes =
    await getUserCurrentTopicComponentStatus(
      userId,
      currentTopicQuery,
      currentLearningObjectiveQuery,
      'enrollmentType',
    );
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
  const { order: currentTopicOrder } = currentTopic;
  // condition to check if topic is free, if not then user should be pro
  // type to access that topic
  if (!isTopicUnlocked(enrollmentType, currentTopicOrder, topicOrder, isTrial)) {
    throw new ComponentLockedError();
  }
  // will remove commented code after review and testing
  // if (topicOrder < currentTopic.order ||
  //     (currentTopicComponentType === topicTypes.quiz) ||
  //     (currentTopicComponentType !== topicTypes.video &&
  //       learningObjectiveOrder < currentLearningObjective.order) ||
  //     (currentTopicComponentType === topicTypes.practiceQuestion &&
  //       learningObjectiveOrder === currentLearningObjective.order)) {
  //   isUnlocked = true;
  // }
  /*
      code will only reach here in case if passed topic order
       is less than or equal to current topic order.
      Here we are checking the case when passed topic order and current topic order are equal
      and passed LO order is greater than current LO order or
      both LO order are equal and current component type is video or chat
      For all above cases we will throw locked error
      */
  const { order: currentLearningObjectiveOrder } = currentLearningObjective;
  if (topicOrder === currentTopicOrder &&
        (learningObjectiveOrder > currentLearningObjectiveOrder ||
          (learningObjectiveOrder === currentLearningObjectiveOrder &&
            (currentTopicComponentType === topicTypes.video ||
              currentTopicComponentType === topicTypes.chat
            )
          )
        )
  ) {
    throw new ComponentLockedError();
  }
  return true;
};

export default addUserActivityPQDumpValidation;
