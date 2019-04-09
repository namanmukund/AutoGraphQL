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

// prehook logic to check if requested chat(user and LO id) is unlocked
const addUserActivityChatDumpValidation = async (params) => {
  // check if the called user and topic is unlocked
  const {
    userConnectId: userId,
    learningObjectiveConnectId: learningObjectiveId,
  } = params;
  if (!userId || !learningObjectiveId) {
    throw new UserOrLearningObjectiveNotPresentError();
  }
  const learningObjectiveQueryRes =
    await getLearningObjectiveAndTopicForValidation(learningObjectiveId);
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
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'LearningObjective: is not present',
      },
    });
  }
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

  // Object.assign(context, {
  //   mutationOrQueryName: {
  //     userCurrentTopicComponentStatuses: data
  //   }
  // })
  //   {
  //     mutationOrQueryName: {
  //       name:mutationOrQueryName,
  //         userCurrentTopicComponentStatuses
  //     :
  //       userCurrentTopicComponentStatuses
  //     }
  //   }
  return true;
};

export default addUserActivityChatDumpValidation;
