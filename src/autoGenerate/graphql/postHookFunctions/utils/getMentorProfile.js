import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const getMentorProfile = async (userId) => {
  const query = `{
    user(id: "${userId}") {
        id
        mentorProfile {
        id
        }
    }
  }`;
  const mentorProfile = await callLocalGraphqlApi(query);
  return get(mentorProfile, 'data.user', {});
};

export const getMentorProfileFromMentorSession = async (mentorSessionId) => {
  const query = `{
  mentorSession(id: "${mentorSessionId}") {
    id
    user {
      id
      mentorProfile {
        id
      }
    }
  }
}`;
  const mentorSession = await callLocalGraphqlApi(query);
  return get(mentorSession, 'data.mentorSession', {});
};

export default getMentorProfile;
