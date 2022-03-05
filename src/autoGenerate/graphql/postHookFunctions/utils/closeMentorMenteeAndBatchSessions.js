/* eslint-disable no-await-in-loop */
import { log } from '../../../../../utils';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const closeMentorMenteeAndBatchSessionsForInactiveMentor = async (input) => {
  const query = `{
    mentorMenteeSessions(
      filter: {
        and: [
          {
            mentorSession_some: {
              user_some: { mentorProfile_some: { id: "${get(input, 'id')}" } }
            }
          }
          { sessionStartDate_gt: "${new Date().toISOString()}" }
        ]
      }
    ) {
      id
    }
    batchSessions(
      filter: {
        and: [
          {
            mentorSession_some: {
              user_some: { mentorProfile_some: { id: "${get(input, 'id')}" } }
            }
          }
          { sessionStartDate_gt: "${new Date().toISOString()}" }
        ]
      }
    ) {
      id
    }
  }`;

  const deleteBatchSessionQuery = (sessionId) => `
  mutation{
    deleteBatchSession(id:"${sessionId}"){
      id
    }
  }
      `;
  const deleteMentorMenteeSessionQuery = (sessionId) => `
  mutation{
    deleteMentorMenteeSession(id:"${sessionId}"){
      id
    }
  }
      `;

  const res = await callLocalGraphqlApi(query);

  const mentorMenteeSessions = get(res, 'data.mentorMenteeSessions', []);
  const batchSessions = get(res, 'data.batchSessions', []);

  for (let i = 0; i < mentorMenteeSessions.length; i += 1) {
    await callLocalGraphqlApi(deleteMentorMenteeSessionQuery(get(mentorMenteeSessions[i], 'id')));
    log(`deleted mentorMenteeSession id ${get(mentorMenteeSessions[i], 'id')}`);
  }

  for (let i = 0; i < batchSessions.length; i += 1) {
    await callLocalGraphqlApi(deleteBatchSessionQuery(get(batchSessions[i], 'id')));
    log(`deleted batchSession id ${get(batchSessions[i], 'id')}`);
  }
};

export default closeMentorMenteeAndBatchSessionsForInactiveMentor;
