import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getMentorMenteeSessionWithoutStudentProfile = async () => {
  const query = `{
  mentorMenteeSessions(filter: { studentProfile_exists: false }) {
    id
    menteeSession {
      id
      user {
        id
        studentProfile {
          id
        }
      }
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.mentorMenteeSessions', []);
};

const updateMentorMenteeSessionQuery = async (mentorMenteeSessionId, studentProfileId) => {
//   input with sessionStatus is mandatory
  const query = `
  mutation {
    updateMentorMenteeSession(id: "${mentorMenteeSessionId}", 
    studentProfileConnectId: "${studentProfileId}",
    ) {
      id
    }
  }
  `;
  const result = await callLocalGraphqlApi(query, '');
  return get(result, 'data.updateMentorMenteeSession', {});
};

const updateMentorMenteeSessionWithStudentProfile = async () => {
  const mentorMenteeSessions = await getMentorMenteeSessionWithoutStudentProfile();
  if (mentorMenteeSessions && mentorMenteeSessions.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const mentorMenteeSession of mentorMenteeSessions) {
      if (get(mentorMenteeSession, 'id') && get(mentorMenteeSession, 'menteeSession.user.studentProfile.id')) {
        // eslint-disable-next-line no-await-in-loop
        await updateMentorMenteeSessionQuery(
          get(mentorMenteeSession, 'id'),
          get(mentorMenteeSession, 'menteeSession.user.studentProfile.id'),
        );
        // eslint-disable-next-line no-console
        console.log(`>>>>> Updated mentorMenteeSession id: ${get(mentorMenteeSession, 'id')}`);
      }
    }
  }
};

export default updateMentorMenteeSessionWithStudentProfile;
