import { get } from 'lodash';
import { MENTEE } from '../../../../../../constants/roles';
import {
  InsufficientPermissionError,
} from '../../../../../../constants/errors';
import { sessionStatus } from '../../../../../../constants';

/*
this method validates whether user should be able to hit API on basis of user role
*/
const validateMentorMenteePermissionForComponentForNewCourse = (
  context,
  topicOrder,
  currentTopicComponentInfo,
  mentorMenteeSessionStatus,
) => {
  const currentUserRole = get(context, 'currentUser.role');

  const {
    currentTopic,
  } = currentTopicComponentInfo;

  const { order: currentTopicOrder } = currentTopic;

  if (currentUserRole === MENTEE
    && (!mentorMenteeSessionStatus || mentorMenteeSessionStatus === sessionStatus.allotted)
    && topicOrder === currentTopicOrder) {
    throw new InsufficientPermissionError();
  }

  return true;
};

export default validateMentorMenteePermissionForComponentForNewCourse;
