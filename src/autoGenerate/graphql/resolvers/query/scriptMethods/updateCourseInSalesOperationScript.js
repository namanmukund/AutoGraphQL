import { get } from 'lodash';
import { log } from '../../../../../../utils';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchLatestMentorMenteeSession = async (clientId) => {
  const query = `
          {
            mentorMenteeSessions(filter:{
              and:[
                {menteeSession_some:
                  {user_some:
                  {id: "${clientId}"}
                  }
                }
              ]
            }
            orderBy: createdAt_DESC){
              id
              menteeSession{
                user{
                  id
                }
              }
              course {
                id
              }
              createdAt
            }
          }
          `;
  const mmSessions = await callLocalGraphqlApi(query);
  return get(mmSessions, 'data.mentorMenteeSessions[0]', {});
};

const fetchSalesOperations = async () => {
  const query = `
          {
            salesOperations{
              id
              client{
                id
              }
              course {
                id
              }
            }
          }
          `;
  const sOperations = await callLocalGraphqlApi(query);
  return get(sOperations, 'data.salesOperations', []);
};

const updateSalesOperation = async (sOperationId, courseId) => {
  const mutation = `
            mutation {
              updateSalesOperation(id: "${sOperationId}"
              courseConnectId: "${courseId}"){
                id
              }
            }
          `;
  const sOperations = await callLocalGraphqlApi(mutation);
  return get(sOperations, 'data.updateSalesOperation', {});
};

const updateCourseInSalesOperationScript = async () => {
  // eslint-disable-next-line no-await-in-loop
  const sOperations = await fetchSalesOperations();
  // eslint-disable-next-line no-restricted-syntax
  for (const operation of sOperations) {
    const clientId = get(operation, 'client.id', '');
    const sOperationId = get(operation, 'id', '');
    log(`Working on sales operation id (${sOperationId})`);
    const sOperationCourseId = get(operation, 'course.id', '');
    // if student's userId is present and course is not connected to sOperation, proceed
    if (clientId && !sOperationCourseId) {
      log(`Fetching MMS for client id ${clientId}`);
      // eslint-disable-next-line no-await-in-loop
      const latestMMSession = await fetchLatestMentorMenteeSession(clientId);
      log('latestMMSession', latestMMSession);
      const courseId = get(latestMMSession, 'course.id', '');
      if (courseId) {
        // eslint-disable-next-line no-await-in-loop
        await updateSalesOperation(sOperationId, courseId);
        log(`updated sales operation (${sOperationId}) with course id (${courseId})`);
      }
    }
  }
};
export default updateCourseInSalesOperationScript;
