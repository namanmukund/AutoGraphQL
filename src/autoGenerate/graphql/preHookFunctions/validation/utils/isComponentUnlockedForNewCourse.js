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
import getUserCurrentTopicComponentStatusForNewCourse from '../../../../utils/getUserCurrentTopicComponentStatusForNewCourse';
import isTopicUnlocked from '../../../../utils/isTopicUnlocked';
import {
  backendApps,
  enrollmentTypes,
  topicTypes,
} from '../../../../../../constants';
import getTopicForValidation from './getTopicForValidation';
import getUserIdandAppNameAfterValidation from './getUserIdandAppNameAfterValidation';
import getBatchCurrentComponentStatus from '../../../../utils/getBatchCurrentComponentStatus';
import validateMentorMenteePermissionForComponentForNewCourse from './validateMentorMenteePermissionForComponentForNewCourse';
import { getMentorMenteeSessionForValidation } from './index';
import { ifAuthorized } from '../../../../../../utils';
import { MENTOR, SCHOOL_TEACHER } from '../../../../../../constants/roles';
import getSortedTopics from '../../../../../../utils/getSortedTopicsFromCoursePackageOrder';
// import isUserInheritedFromMentor from '../../../postHookFunctions/utils/isMentorChild';

/*
This is a common method to check whether the called topic component is locked or not
here page is component type(video, quiz, chat or practice question)
*/
const isComponentUnlockedForNewCourse = async (
  params,
  mutationOrQueryName,
  context,
  page,
  inputUserId = '',
  inputLearningObjectiveId = '',
  checkForPaidLogic = false,
  courseId,
) => {
  const {
    video, message, practiceQuestion, comicStrip, quiz, blockBasedProject, blockBasedPractice, learningSlide,
  } = topicTypes;
  let currentTopicQuery = '';
  let currentLearningObjectiveQuery = '';
  let topicInfo;
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
  // Bypassing component validation incase if schoolTeacher is accessing the content.
  // const checkForMentorChild = await isUserInheritedFromMentor(userIdFromContext, true);
  // if (userIdFromContext && typeof checkForMentorChild === 'boolean' && checkForMentorChild) return true;
  if (page === message || page === practiceQuestion || page === comicStrip || page === learningSlide) {
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
    const learningObjectiveQueryRes = await getLearningObjectiveAndTopicForValidation(learningObjectiveId, courseId);
    learningObjectiveInfo = get(learningObjectiveQueryRes, 'data.learningObjective');
    if (!learningObjectiveInfo) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'LearningObjective: is not present',
        },
      });
    }
    const {
      topic, topics,
    } = learningObjectiveInfo;
    topicInfo = topics[0] || topic;
    // Fetching user current topic component status which will be compared against called LO
    currentTopicQuery = `currentTopic{
                                id
                                order
                             }`;
    currentLearningObjectiveQuery = `currentLearningObjective{
                                            id
                                            order
                                         }`;
  } else if (page === video || page === quiz || page === blockBasedProject || page === blockBasedPractice) {
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
  const authentication = ifAuthorized(context);
  const userRole = get(authentication, 'user.role');
  const isNotMentorOrTeacher = !(userRole === MENTOR || userRole === SCHOOL_TEACHER);
  if ((!backendApps.includes(appName) && userIdFromContext !== userId && page !== 'quiz') && isNotMentorOrTeacher) {
    throw new UserMismatchError();
  }
  if (!topicInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'LearningObjective.topicInfo: is not present',
      },
    });
  }
  const userCurrentTopicComponentStatusRes = await getUserCurrentTopicComponentStatusForNewCourse(
    courseId,
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
    isTrial,
  } = topicInfo;

  let {
    order: topicOrder,
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
  let { order: currentTopicOrder } = currentTopic;
  const { id: currentTopicId } = currentTopic;
  const batchCurrentComponentStatusRes = await getBatchCurrentComponentStatus(
    userId,
  );
  const batchCurrentComponentInfo = get(batchCurrentComponentStatusRes, 'data.user.studentProfile.batch.currentComponent');
  const schoolInfo = get(batchCurrentComponentStatusRes, 'data.user.studentProfile.school');

  const isCoursePackageBatch = get(batchCurrentComponentStatusRes, 'data.user.studentProfile.batch.coursePackage.id');

  if (isCoursePackageBatch) {
    const coursePackageTopics = getSortedTopics(get(batchCurrentComponentStatusRes, 'data.user.studentProfile.batch.coursePackage.topics'));
    // topic we send in input
    const topicFound = coursePackageTopics.find((o) => o.id === topicId);
    topicOrder = get(topicFound, 'coursePackageOrder');
    // current topic we get from userCurrentComponentStatus
    const currentTopicFound = coursePackageTopics.find((o) => o.id === currentTopicId);
    currentTopicOrder = get(currentTopicFound, 'coursePackageOrder');
    // current Topic we get from batchCurrentComponentStatus
    const currentTopicInBatch = coursePackageTopics.find((o) => o.id === get(batchCurrentComponentInfo, 'currentTopic.id'));
    batchCurrentComponentInfo.currentTopic.order = get(currentTopicInBatch, 'coursePackageOrder');
  }

  const { free, pro } = enrollmentTypes;

  let combinedEnrollmentType = get(currentTopicComponentInfo, 'enrollmentType', free);
  if (batchCurrentComponentInfo) {
    const batchEnrollmentType = get(batchCurrentComponentInfo, 'enrollmentType', free);
    combinedEnrollmentType = (enrollmentType === free && batchEnrollmentType === free) ? free : pro;
  }
  if (schoolInfo) {
    const schoolEnrollmentType = get(schoolInfo, 'enrollmentType', free);
    combinedEnrollmentType = (combinedEnrollmentType === free && schoolEnrollmentType === free ? free : pro);
  }
  /*
  condition to check if chat can be accessed:
  if called topic order is less than current topic order or
  other case is when called topic order is equal to current topic order
  in that case we are checking current component type and lo order
  */
  if (!isTopicUnlocked(
    combinedEnrollmentType,
    currentTopicOrder,
    topicOrder,
    isTrial,
    page,
    checkForPaidLogic,
    batchCurrentComponentInfo,
  )) {
    // placing logic to send correct message if a paid video is locked coz free user is trying to access it
    if (batchCurrentComponentInfo) {
      if (combinedEnrollmentType === free
        && topicOrder <= currentTopicOrder
        && isTrial !== true && page === video) {
        throw new PaidComponentLockedError();
      } else {
        throw new ComponentLockedError();
      }
    } else {
      /* eslint-disable no-lonely-if */
      if (combinedEnrollmentType === free
        && topicOrder <= currentTopicOrder
        && isTrial !== true && page === video) {
        throw new PaidComponentLockedError();
      } else {
        throw new ComponentLockedError();
      }
    }
  }

  // check if mentee should be able to watch a video
  // check if user has permission to hit API according to his role, if user is mentee and there is
  // no mentor token, he should not be able to hit API
  // this will be checked for normal flow and not for batch
  if (!batchCurrentComponentInfo) {
    const mentorMenteeSessionQueryRes = await getMentorMenteeSessionForValidation(userId, topicId);
    const mentorMenteeSessionStatus = get(mentorMenteeSessionQueryRes, 'data.mentorMenteeSessions[0].sessionStatus', '');

    validateMentorMenteePermissionForComponentForNewCourse(
      context,
      topicOrder,
      currentTopicComponentInfo,
      mentorMenteeSessionStatus,
    );
  }
  // for video we don't need to check on LO level as video is first component
  // this condition checks whether isTopicLocked is called from addDump APIs or not
  if (mutationOrQueryName) {
    // initialising object to be passed in context to save query
    const userCurrentTopicComponentStatusData = {};
    if (page === message || page === practiceQuestion || page === comicStrip || page === learningSlide) {
      // passing data in context which can be used further in post hook methods
      // this will prevent a further query
      userCurrentTopicComponentStatusData[mutationOrQueryName] = {
        userCurrentTopicComponentStatuses: currentTopicComponentInfo,
        learningObjective: learningObjectiveInfo,
      };
    } else if (page === video || page === quiz || page === blockBasedProject || page === blockBasedPractice) {
      userCurrentTopicComponentStatusData[mutationOrQueryName] = {
        userCurrentTopicComponentStatuses: currentTopicComponentInfo,
      };
    }
    Object.assign(context, userCurrentTopicComponentStatusData);
  }

  return true;
};

export default isComponentUnlockedForNewCourse;
