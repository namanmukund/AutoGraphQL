import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

// query to get all mentorMenteeSessions
const getMentorMenteeSessions = (skip) => `
  query{
    mentorMenteeSessions(orderBy: sessionStartDate_DESC, first: 1000, skip: ${skip}) {
      id
      mentorSession {
        id
      }
    }
  }
  `;

// query to get all batchSessions
const getBatchSessions = (skip) => `
  query{
    batchSessions(orderBy: sessionStartDate_DESC, first: 1000, skip: ${skip}) {
      id
      mentorSession {
        id
      }
    }
  }
  `;

// mutation to update batchSessionId/mentorMenteeSessionId
const updateMentorSession = (mentorSessionId, mentorMenteeSessionId, batchSessionId) => `
  mutation{
    updateMentorSession(id: "${mentorSessionId}",
      ${mentorMenteeSessionId ? `mentorMenteeSessionsConnectIds: ["${mentorMenteeSessionId}"]` : ''}
      ${batchSessionId ? `batchSessionConnectIds: ["${batchSessionId}"]` : ''}
      input:{}){
      id
    }
  }
`;

const updateMMSandBatchSessionInMentorSession = async () => {
  let skipMentorMenteeSession = 0;
  let totalMentorMenteeSessionCount = 0;
  let mentorMenteeSessionsArray = [];
  /*
    this part handles the updation of mentorMenteeSession in mentorSession
  */
  do {
    // eslint-disable-next-line no-console
    console.log('------------------------------skipMentorMenteeSession', skipMentorMenteeSession);
    const mentorMenteeSessionsQueryRes = await callLocalGraphqlApi(getMentorMenteeSessions(skipMentorMenteeSession));
    mentorMenteeSessionsArray = get(mentorMenteeSessionsQueryRes, 'data.mentorMenteeSessions', []);
    // eslint-disable-next-line no-restricted-syntax
    for (const mentorMenteeSession of mentorMenteeSessionsArray) {
      if (mentorMenteeSession.id && mentorMenteeSession.mentorSession && mentorMenteeSession.mentorSession.id) {
        totalMentorMenteeSessionCount += 1;
        // eslint-disable-next-line no-console
        console.log('----------------------------totalMentorMenteeSessionCount-----------------------------', totalMentorMenteeSessionCount);
        // eslint-disable-next-line no-console
        console.log('----------------------------mentorSessionId', mentorMenteeSession.mentorSession.id);
        try {
          // eslint-disable-next-line no-await-in-loop
          await callLocalGraphqlApi(updateMentorSession(
            mentorMenteeSession.mentorSession.id,
            mentorMenteeSession.id,
          ));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('----------------------updateMentorSession error', e);
        }
      }
    }
    skipMentorMenteeSession += 1000;
  } while (mentorMenteeSessionsArray.length === 1000);

  let skipBatchSession = 0;
  let totalBatchSessionCount = 0;
  let batchSessionsArray = [];
  /*
    this part handles the updation of batchSession in mentorSession
  */
  do {
    // eslint-disable-next-line no-console
    console.log('------------------------------skipBatchSession', skipBatchSession);
    // eslint-disable-next-line no-await-in-loop
    const batchSessionsQueryRes = await callLocalGraphqlApi(getBatchSessions(skipBatchSession));
    batchSessionsArray = get(batchSessionsQueryRes, 'data.batchSessions', []);
    // eslint-disable-next-line no-restricted-syntax
    for (const batchSession of batchSessionsArray) {
      if (batchSession.id && batchSession.mentorSession && batchSession.mentorSession.id) {
        totalBatchSessionCount += 1;
        // eslint-disable-next-line no-console
        console.log('----------------------------totalBatchSessionCount-----------------------------', totalBatchSessionCount);
        // eslint-disable-next-line no-console
        console.log('----------------------------mentorSessionId', batchSession.mentorSession.id);
        try {
          // eslint-disable-next-line no-await-in-loop
          await callLocalGraphqlApi(updateMentorSession(
            batchSession.mentorSession.id,
            null,
            batchSession.id,
          ));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('----------------------updateMentorSession error', e);
        }
      }
    }
    skipBatchSession += 1000;
  } while (batchSessionsArray.length === 1000);

  // eslint-disable-next-line no-console
  console.log('------------------------------totalMentorMenteeSessionCount', totalMentorMenteeSessionCount);
  // eslint-disable-next-line no-console
  console.log('------------------------------totalBatchSessionCount', totalBatchSessionCount);
};

export default updateMMSandBatchSessionInMentorSession;
