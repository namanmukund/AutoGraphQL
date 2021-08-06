import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const getMentorMenteeSession = async (menteeSessionId) => {
  const mentorMenteeSessionQuery = `{
    mentorMenteeSessions(filter: { menteeSession_some: { id: "${menteeSessionId}" } }) {
      id
      hasRescheduled
      rescheduledDate
      rescheduledDateProvided
      mentorSession {
        id
      }
    }
  }`;
  const mentorMenteeSession = await callLocalGraphqlApi(mentorMenteeSessionQuery);
  return {
    mentorSessionId: get(mentorMenteeSession, 'data.mentorMenteeSessions[0].mentorSession.id', ''),
    id: get(mentorMenteeSession, 'data.mentorMenteeSessions[0].id', ''),
  };
};

export default getMentorMenteeSession;
