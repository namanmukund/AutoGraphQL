import { get } from 'lodash';
import {
  topicTypes,
} from '../../../../../constants';
import {
  ComponentLockedError, DatabaseRecordNotFoundError,
  UserOrLearningObjectiveNotPresentError,
} from '../../../../../constants/errors';
import isTopicUnlocked from '../../../utils/isTopicUnlocked';
import getUserCurrentTopicComponentStatus from '../../../utils/getUserCurrentTopicComponentStatus';
import getLearningObjectiveAndTopicForValidation
  from './utils/getLearningObjectiveAndTopicForValidation';

// prehook logic to check if requested UserLO(user and LO id) is unlocked
const userLearningObjectiveValidation = async (params) => {
  // userLearningObjective collection is used to store and get chat and pq page info
  // checking if called lo and user combination is accessible
  const filterArray = get(params, 'filter.and');
  if (!filterArray) {
    throw new UserOrLearningObjectiveNotPresentError();
  }
  const userSome = filterArray.find(obj => obj.user_some);
  const loSome = filterArray.find(obj => obj.learningObjective_some);
  const userId = get(userSome, 'user_some.id');
  const learningObjectiveId = get(loSome, 'learningObjective_some.id');
  if (!userId || !learningObjectiveId) {
    throw new UserOrLearningObjectiveNotPresentError();
  }
  const learningObjectiveQueryRes =
    await getLearningObjectiveAndTopicForValidation(learningObjectiveId);
  const learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
  if (!learningObjectiveInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'LearningObjective: is not present',
      },
    });
  }
  const { topic: topicInfo, order: learningObjectiveOrder } = learningObjectiveInfo;
  // Fetching user current topic component status which will be compared against called LO
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
    currentLearningObjective,
    currentTopicComponentType,
    enrollmentType,
  } = currentTopicComponentInfo;
  if (!currentTopic) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponentInfo.CurrentTopic: is not present',
      },
    });
  }
  if (!currentLearningObjective) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponentInfo.CurrentLearningObjective: is not present',
      },
    });
  }
  if (!currentTopicComponentType) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponentInfo.CurrentTopicComponentType: is not present',
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
  const { order: currentTopicOrder } = currentTopic;
  // condition to check if topic is free, if not then user should be pro
  // type to access that topic
  if (!isTopicUnlocked(enrollmentType, currentTopicOrder, topicOrder, isTrial)) {
    throw new ComponentLockedError();
  }
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

export default userLearningObjectiveValidation;
