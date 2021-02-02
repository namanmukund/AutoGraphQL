import { get } from 'lodash';
import { MENTEE } from '../../../../../../constants/roles';
import {
  DatabaseRecordNotFoundError,
  InsufficientPermissionError,
} from '../../../../../../constants/errors';
import { topicTypes, sessionStatus } from '../../../../../../constants';

/*
this method validates whether user should be able to hit API on basis of user role
*/
const validateMentorMenteePermissionForComponent = (
  context,
  topicOrder,
  learningObjectiveOrder,
  page,
  currentTopicComponentInfo,
  mentorMenteeSessionStatus,
) => {
  const {
    video, message, practiceQuestion,
  } = topicTypes;
  const currentUserRole = get(context, 'currentUser.role');

  const {
    currentTopic,
    currentTopicComponentType,
  } = currentTopicComponentInfo;

  const { order: currentTopicOrder } = currentTopic;

  console.log('---------------------mentorMenteeSessionStatus', mentorMenteeSessionStatus);
  console.log('---------------------currentUserRole', currentUserRole);
  console.log('---------------------page', page);
  console.log('---------------------topicOrder', topicOrder);
  console.log('---------------------currentTopicOrder', currentTopicOrder);
  console.log('---------------------currentTopicComponentType', currentTopicComponentType);

  switch (page) {
    case video: {
      // condition if mentee is trying to access a video which is yet to be taught
      if (currentUserRole === MENTEE
            && (!mentorMenteeSessionStatus || mentorMenteeSessionStatus === sessionStatus.allotted)
            && topicOrder === currentTopicOrder
            && currentTopicComponentType === video) {
        console.log('---------------------oops');
        throw new InsufficientPermissionError();
      }
      break;
    }
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
      // condition if mentee is trying to access a chat which is yet to be taught
      const { order: currentLearningObjectiveOrder } = currentLearningObjective;
      if (currentUserRole === MENTEE
          && (!mentorMenteeSessionStatus || mentorMenteeSessionStatus === sessionStatus.allotted)
          && topicOrder === currentTopicOrder
          && learningObjectiveOrder === currentLearningObjectiveOrder
          && currentTopicComponentType === message) {
        throw new InsufficientPermissionError();
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
      // condition if mentee is trying to access a PQ which is yet to be taught
      const { order: currentLearningObjectiveOrder } = currentLearningObjective;
      if (currentUserRole === MENTEE
          && (!mentorMenteeSessionStatus || mentorMenteeSessionStatus === sessionStatus.allotted)
          && topicOrder === currentTopicOrder
          && learningObjectiveOrder === currentLearningObjectiveOrder
          && currentTopicComponentType === practiceQuestion) {
        throw new InsufficientPermissionError();
      }
      break;
    }
    default:
  }

  return true;
};

export default validateMentorMenteePermissionForComponent;
