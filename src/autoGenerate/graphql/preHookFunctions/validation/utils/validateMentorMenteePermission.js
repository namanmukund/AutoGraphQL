import { get } from 'lodash';
import { MENTEE } from '../../../../../../constants/roles';
import { InsufficientPermissionError } from '../../../../../../constants/errors';

/*
this method validates whether user should be able to hit API on basis of user role
*/
const validateMentorMenteePermission = (context) => {
  const currentUserRole = get(context, 'currentUser.role');
  const currentMentorId = get(context, 'currentMentor.id');

  if (currentUserRole === MENTEE && !currentMentorId) {
    throw new InsufficientPermissionError();
  }

  return true;
};

export default validateMentorMenteePermission;
