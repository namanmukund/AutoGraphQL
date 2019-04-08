import { get } from 'lodash';
import {
  topicTypes,
} from '../../../../../constants';
import {
  ComponentLockedError,
  DatabaseRecordNotFoundError,
  UserOrTopicNotPresentError,
} from '../../../../../constants/errors';
import isTopicUnlocked from '../../../utils/isTopicUnlocked';
import getUserCurrentTopicComponentStatus from '../../../utils/getUserCurrentTopicComponentStatus';
import getTopicForValidation from './utils/getTopicForValidation';

// prehook logic to check if requested UserQuiz(user and topic id) is unlocked
const userQuizValidation = async (params) => {
  // check if the called user and topic is unlocked
  const filterArray = get(params, 'filter.and');
  const userSome = filterArray.find(obj => obj.user_some);
  const topicSome = filterArray.find(obj => obj.topic_some);
  const userId = get(userSome, 'user_some.id');
  const topicId = get(topicSome, 'topic_some.id');
  if (!userId || !topicId) {
    throw new UserOrTopicNotPresentError();
  }
  const topicQueryRes = await getTopicForValidation(topicId);
  const topicInfo = get(topicQueryRes, 'data.topic');
  const currentTopicQuery = `currentTopic{
                                id
                                order
                             }`;
  const userCurrentTopicComponentStatusRes =
    await getUserCurrentTopicComponentStatus(
      userId,
      currentTopicQuery,
      '',
      'enrollmentType',
    );
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

export default userQuizValidation;
