import { get } from 'lodash';
import { MENTEE } from '../../../../../../constants/roles';
import { UserPermissionError } from '../../../../../../constants/errors';

/*
this method validates whether user should be able to hit API on basis of user role
*/
const checkUserRoleValidation = (context) => {
  const currentUserRole = get(context, 'currentUser.role');
  const currentMentorId = get(context, 'currentMentor.id');

  if (currentUserRole === MENTEE && !currentMentorId) {
    throw new UserPermissionError();
  }

  return true;
};

export default checkUserRoleValidation;
