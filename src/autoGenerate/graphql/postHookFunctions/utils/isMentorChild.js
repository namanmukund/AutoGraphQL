import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const mentorChildCheckQuery = (userId) => `
{
    user(id: "${userId}") {
      studentProfile {
        mentor {
          id
        }
      }
    }
  }
`;

const isUserIsMentorChild = async (userId) => {
  const userData = await callLocalGraphqlApi(mentorChildCheckQuery(userId));
  const mentorChildId = get(userData, 'data.user.studentProfile.mentor.id', null);

  return mentorChildId !== null;
};

export default isUserIsMentorChild;
