import { get } from 'lodash';
import { SCHOOL_TEACHER } from '../../../../../constants/roles';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const mentorChildCheckQuery = (userId, fetchSecondaryRole = false) => `
{
    user(id: "${userId}") {
      studentProfile {
        mentor {
          id
          ${fetchSecondaryRole ? 'user { role secondaryRole }' : ''}
        }
      }
    }
  }
`;

const isUserIsMentorChild = async (userId, checkIfSchoolTeacher = false) => {
  const userData = await callLocalGraphqlApi(mentorChildCheckQuery(userId, checkIfSchoolTeacher));
  const mentorChildId = get(userData, 'data.user.studentProfile.mentor.id', null);
  if (checkIfSchoolTeacher
    && get(userData, 'data.user.studentProfile.mentor.secondaryRole', null) !== SCHOOL_TEACHER
  ) return false;
  return Boolean(mentorChildId);
};

export default isUserIsMentorChild;
