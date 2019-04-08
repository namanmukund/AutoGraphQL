import { get } from 'lodash';
import {
} from '../../../../../constants';
import {
  ComponentLockedError,
  DatabaseRecordNotFoundError,
  UserOrTopicNotPresentError,
} from '../../../../../constants/errors';
import isTopicUnlocked from '../../../utils/isTopicUnlocked';
import getUserCurrentTopicComponentStatus from '../../../utils/getUserCurrentTopicComponentStatus';
import getTopicForValidation from './utils/getTopicForValidation';

// prehook logic to check if requested UserVideo(user and topic id) is unlocked
const userVideoValidation = async (params) => {
  // userVideo collection is used to store and get video page info
  // checking if called topic and user combination in accessible
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
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'LearningObjective.topicInfo: is not present',
      },
    });
  }
  if (!currentTopicComponentInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponentInfo: is not present',
      },
    });
  }
  const {
    order: topicOrder,
    isTrial,
  } = topicInfo;
  const {
    currentTopic,
    enrollmentType,
  } = currentTopicComponentInfo;
  if (!currentTopic) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponentInfo.CurrentTopic: is not present',
      },
    });
  }
  if (!enrollmentType) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponentInfo.EnrollmentType: is not present',
      },
    });
  }
  // condition to check if topic is free, if not then user should be pro
  // type to access that topic
  const { order: currentTopicOrder } = currentTopic;
  // throwing component is locked error
  if (!isTopicUnlocked(enrollmentType, currentTopicOrder, topicOrder, isTrial)) {
    throw new ComponentLockedError();
  }
  return true;
};

export default userVideoValidation;
