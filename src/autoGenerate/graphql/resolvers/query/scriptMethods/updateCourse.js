/* eslint-disable camelcase */
/* eslint-disable no-console */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

// eslint-disable-next-line no-unused-vars
const fetchMentorMenteeSessions = async () => {
  const query = `
          {
            mentorMenteeSessions(first:1000
            ){
              id
              sessionStatus
              course {
                id
              }
              topic {
                id
                courses{
                  id
                  title
                }
              }
            }
          }
          `;
  const sessions = await callLocalGraphqlApi(query);
  return get(sessions, 'data.mentorMenteeSessions', []);
};

// eslint-disable-next-line no-unused-vars
const fetchMenteeSessions = async () => {
  const query = `
            {
              menteeSessions(first:1000){
                id
                course{
                  id
                }
                topic{
                  id
                  courses{
                    id
                    title
                  }
                }
              }
            }
          `;
  const sessions = await callLocalGraphqlApi(query);
  return get(sessions, 'data.menteeSessions', []);
};

// eslint-disable-next-line no-unused-vars
const fetchBatchSessions = async () => {
  const query = `
            {
              batchSessions(first: 1000){
                id
                course{
                  id
                }
                topic{
                  id
                  courses{
                    id
                    title
                  }
                }
              }
            }
          `;
  const sessions = await callLocalGraphqlApi(query);
  return get(sessions, 'data.batchSessions', []);
};

// eslint-disable-next-line no-unused-vars
const updateMentorMenteeSession = async (sessionId, courseConnectId, sessionStatus) => {
  const mutation = `
      mutation{
          updateMentorMenteeSession(id:"${sessionId}",
          courseConnectId:"${courseConnectId}",
          input: {
            sessionStatus: ${sessionStatus}
          }
          ){
            id
          }
        }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.updateMentorMenteeSession', {});
};

// eslint-disable-next-line no-unused-vars
const updateMenteeSession = async (sessionId, courseId) => {
  const mutation = `
      mutation{
          updateMentorSession(id: "${sessionId}",
          courseConnectId: "${courseId}"
          ){
            id
          }
        }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.updateMentorSession', {});
};

// eslint-disable-next-line no-unused-vars
const updateBatchSession = async (sessionId, courseConnectId) => {
  const mutation = `
      mutation{
          updateBatchSession(id: "${sessionId}",
          courseConnectId: "${courseConnectId}"
          ){
            id
          }
        }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.updateBatchSession', {});
};

const updateCourse = async () => {
  /*
    update course in mentorMenteeSessions
  */
  let mm_sessions_length = 0;
  do {
    // eslint-disable-next-line no-await-in-loop
    const mm_sessions = await fetchMentorMenteeSessions();
    mm_sessions_length = mm_sessions.length;
    // eslint-disable-next-line no-restricted-syntax
    for (const session of mm_sessions) {
      const sessionId = get(session, 'id');
      const courseId = get(session, 'topic.courses[0].id');
      const sessionStatus = get(session, 'sessionStatus');
      const course = get(session, 'course');
      console.log(`>>>>> Checking : ${sessionId}, with courseId : ${courseId}, sessionStatus: ${sessionStatus}`);
      if (sessionId && courseId && !course) {
        // eslint-disable-next-line no-await-in-loop
        await updateMentorMenteeSession(sessionId, courseId, sessionStatus);
        console.log(`>>>>> Updated session id : ${sessionId}, with course : ${session.topic.courses[0].title}`);
      }
    }
  } while (mm_sessions_length === 1000);
  console.log('>>>>> Finished updating courses in mentorMenteeSessions!!!');
  /*
      update course in mentorSessions
    */
  let m_sessions_length = 0;
  do {
    // eslint-disable-next-line no-await-in-loop
    const m_sessions = await fetchMenteeSessions();
    m_sessions_length = m_sessions.length;
    // eslint-disable-next-line no-restricted-syntax
    for (const session of m_sessions) {
      const sessionId = get(session, 'id');
      const courseId = get(session, 'topic.courses[0].id');
      const course = get(session, 'course');
      console.log(`>>>>> Checking : ${sessionId}, with courseId : ${courseId}`);
      if (sessionId && courseId && !course) {
        // eslint-disable-next-line no-await-in-loop
        await updateMenteeSession(sessionId, courseId);
        console.log(`>>>>> Updated session id : ${sessionId}, with course : ${session.topic.courses[0].title}`);
      }
    }
  } while (m_sessions_length === 1000);
  console.log('>>>>> Finished updating courses in mentorSessions!!!');
  /*
     update course in batchSessions
   */
  let b_sessions_length = 0;
  do {
    // eslint-disable-next-line no-await-in-loop
    const b_sessions = await fetchBatchSessions();
    b_sessions_length = b_sessions.length;
    // eslint-disable-next-line no-restricted-syntax
    for (const session of b_sessions) {
      const sessionId = get(session, 'id');
      const courseId = get(session, 'topic.courses[0].id');
      const course = get(session, 'course');
      console.log(`>>>>> Checking : ${sessionId}, with courseId : ${courseId}`);
      if (sessionId && courseId && !course) {
        // eslint-disable-next-line no-await-in-loop
        await updateBatchSession(sessionId, courseId);
        console.log(`>>>>> Updated session id : ${sessionId}, with course : ${session.topic.courses[0].title}`);
      }
    }
  } while (b_sessions_length === 1000);
  console.log('>>>>> Finished updating courses in batchSessions!!!');
};
export default updateCourse;
