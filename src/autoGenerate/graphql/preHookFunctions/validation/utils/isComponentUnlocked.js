// logic to checkif a component is unlocked
import { get } from 'lodash';
import getLearningObjectiveAndTopicForValidation from './getLearningObjectiveAndTopicForValidation';
import {
  ComponentLockedError,
  DatabaseRecordNotFoundError,
  UserMismatchError,
  UserOrLearningObjectiveNotPresentError,
  UserOrTopicNotPresentError,
  PaidComponentLockedError,
} from '../../../../../../constants/errors';
import getUserCurrentTopicComponentStatus
  from '../../../../utils/getUserCurrentTopicComponentStatus';
import isTopicUnlocked from '../../../../utils/isTopicUnlocked';
import {
  backendApps,
  enrollmentTypes,
  topicTypes,
} from '../../../../../../constants';
import getTopicForValidation from './getTopicForValidation';
import getUserIdandAppNameAfterValidation from './getUserIdandAppNameAfterValidation';
import { validateMentorMenteePermissionForComponent, getMentorMenteeSessionForValidation } from './index';
import getBatchCurrentComponentStatus
  from '../../../../utils/getBatchCurrentComponentStatus';

/*
This is a common method to check whether the called topic component is locked or not
here page is component type(video, quiz, chat or practice question)
*/
const isComponentUnlocked = async (
  params,
  mutationOrQueryName,
  context,
  page,
  inputUserId = '',
  inputLearningObjectiveId = '',
  checkForPaidLogic = false,
  queryNameToPassData = '',
) => {
  const {
    video, message, practiceQuestion, quiz,
  } = topicTypes;
  let currentTopicQuery = '';
  let currentLearningObjectiveQuery = '';
  let topicInfo;
  let learningObjectiveOrder;
  let learningObjectiveInfo;
  let userId;
  let learningObjectiveId;
  let topicId;
  /*
  Calling method to validate token and return userId and appName
  we will compare this userId against userId passed in input
  both should be equal to perform further action
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    userIdFromContext,
    appName,
  } = userAndAppInfo;
  if (page === message || page === practiceQuestion) {
    if (inputUserId && inputLearningObjectiveId) {
      userId = inputUserId;
      learningObjectiveId = inputLearningObjectiveId;
    } else if (mutationOrQueryName) {
      userId = get(params, 'userConnectId');
      learningObjectiveId = get(params, 'learningObjectiveConnectId');
    } else {
      const filterArray = get(params, 'filter.and');
      // if there is no filterArray, we do not need to validate whether component is unlocked
      if (!filterArray) {
        return true;
      }
      const userSome = filterArray.find((obj) => obj.user_some);
      const loSome = filterArray.find((obj) => obj.learningObjective_some);
      userId = get(userSome, 'user_some.id');
      learningObjectiveId = get(loSome, 'learningObjective_some.id');
      // if there is no learningObjectiveId, no need to validate whether component is unlocked
      if (!learningObjectiveId) {
        return true;
      }
    }
    if (!userId || !learningObjectiveId) {
      throw new UserOrLearningObjectiveNotPresentError();
    }
    const learningObjectiveQueryRes = await getLearningObjectiveAndTopicForValidation(learningObjectiveId);
    learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
    if (!learningObjectiveInfo) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'LearningObjective: is not present',
        },
      });
    }
    const {
      topic,
      order,
    } = learningObjectiveInfo;
    topicInfo = topic;
    learningObjectiveOrder = order;
    // Fetching user current topic component status which will be compared against called LO
    currentTopicQuery = `currentTopic{
                                id
                                order
                             }`;
    currentLearningObjectiveQuery = `currentLearningObjective{
                                            id
                                            order
                                         }`;
  } else if (page === video || page === quiz) {
    if (mutationOrQueryName) {
      userId = get(params, 'userConnectId');
      topicId = get(params, 'topicConnectId');
    } else {
      const filterArray = get(params, 'filter.and');
      // if there is no filterArray, we do not need to validate whether component is unlocked
      if (!filterArray) {
        return true;
      }
      const userSome = filterArray.find((obj) => obj.user_some);
      const topicSome = filterArray.find((obj) => obj.topic_some);
      userId = get(userSome, 'user_some.id');
      topicId = get(topicSome, 'topic_some.id');
      // if there is no topicId, we do not need to validate whether component is unlocked
      if (!topicId) {
        return true;
      }
    }
    if (!userId || !topicId) {
      throw new UserOrTopicNotPresentError();
    }
    const topicQueryRes = await getTopicForValidation(topicId);
    topicInfo = get(topicQueryRes, 'data.topic');
    // Fetching user current topic component status which will be compared against called topic
    currentTopicQuery = `currentTopic{
                                id
                                order
                             }`;
  }
  if (!backendApps.includes(appName) && userIdFromContext !== userId) {
    throw new UserMismatchError();
  }
  if (!topicInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'LearningObjective.topicInfo: is not present',
      },
    });
  }
  const userCurrentTopicComponentStatusRes = await getUserCurrentTopicComponentStatus(
    userId,
    currentTopicQuery,
    currentLearningObjectiveQuery,
    'enrollmentType',
  );
  const currentTopicComponentInfo = get(userCurrentTopicComponentStatusRes, 'data.userCurrentTopicComponentStatuses[0]');
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

  topicId = topicInfo && topicInfo.id;
  const {
    currentTopic,
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
  const batchCurrentComponentStatusRes = await getBatchCurrentComponentStatus(
    userId,
  );
  const batchCurrentComponentInfo = get(batchCurrentComponentStatusRes, 'data.user.studentProfile.batch.currentComponent');
  const batchCurrentComponentBatchType = get(batchCurrentComponentStatusRes, 'data.user.studentProfile.batch.type');
  /*
  condition to check if chat can be accessed:
  if called topic order is less than current topic order or
  other case is when called topic order is equal to current topic order
  in that case we are checking current component type and lo order
  */
  if (!isTopicUnlocked(
    enrollmentType,
    currentTopicOrder,
    topicOrder,
    isTrial,
    page,
    checkForPaidLogic,
    batchCurrentComponentInfo,
    batchCurrentComponentBatchType,
  )) {
    // placing logic to send correct message if a paid video is locked coz free user is trying to access it
    const { free } = enrollmentTypes;

    if (enrollmentType === free
        && topicOrder <= currentTopicOrder
        && isTrial !== true && page === video) {
      throw new PaidComponentLockedError();
    } else {
      throw new ComponentLockedError();
    }
  }

  // check if mentee should be able to watch a video
  // check if user has permission to hit API according to his role, if user is mentee and there is
  // no mentor token, he should not be able to hit API
  // this will be checked for normal flow and not for batch
  if (!batchCurrentComponentInfo) {
    const mentorMenteeSessionQueryRes = await getMentorMenteeSessionForValidation(userId, topicId);
    const mentorMenteeSessionStatus = get(mentorMenteeSessionQueryRes, 'data.mentorMenteeSessions[0].sessionStatus', '');

    validateMentorMenteePermissionForComponent(
      context,
      topicOrder,
      learningObjectiveOrder,
      page,
      currentTopicComponentInfo,
      mentorMenteeSessionStatus,
    );

    switch (page) {
      case message: {
        const {
          currentLearningObjective,
        } = currentTopicComponentInfo;
        if (!currentLearningObjective) {
          throw new DatabaseRecordNotFoundError({
            data: {
              error: 'CurrentTopicComponentInfo.CurrentLearningObjective: is not present',
            },
          });
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
        if (topicOrder === currentTopicOrder
          && (learningObjectiveOrder > currentLearningObjectiveOrder
            || (learningObjectiveOrder === currentLearningObjectiveOrder
              && currentTopicComponentType === topicTypes.video
            )
          )
        ) {
          throw new ComponentLockedError();
        }
        break;
      }
      case practiceQuestion: {
        const {
          currentLearningObjective,
        } = currentTopicComponentInfo;
        if (!currentLearningObjective) {
          throw new DatabaseRecordNotFoundError({
            data: {
              error: 'CurrentTopicComponentInfo.CurrentLearningObjective: is not present',
            },
          });
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
        if (topicOrder === currentTopicOrder
          && (learningObjectiveOrder > currentLearningObjectiveOrder
            || (learningObjectiveOrder === currentLearningObjectiveOrder
              && currentTopicComponentType === topicTypes.video
            )
          )
        ) {
          throw new ComponentLockedError();
        }
        break;
      }
      case quiz: {
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
        if (topicOrder === currentTopicOrder
          && currentTopicComponentType !== topicTypes.quiz
        ) {
          throw new ComponentLockedError();
        }
        break;
      }
      default:
    }
  }
  // for video we don't need to check on LO level as video is first component
  // this condition checks whether isTopicLocked is called from addDump APIs or not
  if (mutationOrQueryName) {
    // initialising object to be passed in context to save query
    const userCurrentTopicComponentStatusData = {};
    if (page === 'message' || page === 'practiceQuestion') {
      // passing data in context which can be used further in post hook methods
      // this will prevent a further query
      userCurrentTopicComponentStatusData[mutationOrQueryName] = {
        userCurrentTopicComponentStatuses: currentTopicComponentInfo,
        learningObjective: learningObjectiveInfo,
      };
    } else if (page === 'video' || page === 'quiz') {
      userCurrentTopicComponentStatusData[mutationOrQueryName] = {
        userCurrentTopicComponentStatuses: currentTopicComponentInfo,
      };
    }
    Object.assign(context, userCurrentTopicComponentStatusData);
  }

  // this condition is added if we need to pass data in other than dump APIs
  // Currently it is needed for UserAssignment only. Modify it in future as per need
  if (queryNameToPassData && page === 'quiz') {
    // initialising object to be passed in context to save query
    const userCurrentTopicComponentStatusData = {};
    // passing data in context which can be used further in post hook methods
    // this will prevent a further query
    userCurrentTopicComponentStatusData[queryNameToPassData] = {
      userCurrentTopicComponentStatuses: currentTopicComponentInfo,
    };
    Object.assign(context, userCurrentTopicComponentStatusData);
  }

  return true;
};

export default isComponentUnlocked;
