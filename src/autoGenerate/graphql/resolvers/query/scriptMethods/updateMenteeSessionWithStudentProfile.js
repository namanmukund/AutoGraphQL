import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getMenteeSessionWithoutStudentProfile = async () => {
  const query = `{
  menteeSessions(filter: { studentProfile_exists: false }) {
    id
    user {
      id
      studentProfile {
        id
      }
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.menteeSessions', []);
};

const updateMenteeSessionQuery = async (menteeSessionId, studentProfileId) => {
  const query = `
mutation {
  updateMenteeSession(id: "${menteeSessionId}", studentProfileConnectId: "${studentProfileId}") {
    id
  }
}
  `;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.updateMenteeSession', {});
};

const updateMenteeSessionWithStudentProfile = async () => {
  const menteeSessions = await getMenteeSessionWithoutStudentProfile();
  if (menteeSessions && menteeSessions.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const menteeSession of menteeSessions) {
      if (get(menteeSession, 'id') && get(menteeSession, 'user.studentProfile.id')) {
        // eslint-disable-next-line no-await-in-loop
        await updateMenteeSessionQuery(
          get(menteeSession, 'id'),
          get(menteeSession, 'user.studentProfile.id'),
        );
        // eslint-disable-next-line no-console
        console.log(`>>>>> Updated menteeSession id: ${get(menteeSession, 'id')}`);
      }
    }
  }
};

export default updateMenteeSessionWithStudentProfile;
