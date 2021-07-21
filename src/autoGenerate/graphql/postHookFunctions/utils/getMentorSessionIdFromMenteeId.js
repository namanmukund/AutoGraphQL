import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const getMentorSessionIdFromMenteeId = async (menteeSessionId) => {
  const mentorMenteeSessionQuery = `{
    mentorMenteeSessions(filter: { menteeSession_some: { id: "${menteeSessionId}" } }) {
      mentorSession {
        id
      }
    }
  }`;
  const mentorMenteeSession = await callLocalGraphqlApi(mentorMenteeSessionQuery);
  return get(mentorMenteeSession, 'data.mentorMenteeSessions[0].mentorSession.id');
};

export default getMentorSessionIdFromMenteeId;
