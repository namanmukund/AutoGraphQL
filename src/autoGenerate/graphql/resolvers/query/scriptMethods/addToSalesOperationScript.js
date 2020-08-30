import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const mentorMenteeSessionsQuery = () => `
query{
  mentorMenteeSessions(filter:{
    and:[
      {topic_some:{
        order:1
      }}
    ]
  }){
    id
    mentorSession{
      id
      user{
        id
      }
    }
    menteeSession{
      id
      user{
        id
      }
    }
  }
}
`;

const salesOperationsQuery = () => `
query{
  salesOperations{
    id
    client{
      id
    }
  }
}
`;
const addToSalesOperationAllottedMentorQuery = (salesOperationId, userId) => `
mutation{
  addToSalesOperationAllottedMentor(
    salesOperationId: "${salesOperationId}"
    userId:"${userId}"
  ){
    fieldName
    connectedTypeName
    connectedFieldName
  }
}
`;

const addToSalesOperationFirstMentorMenteeSessionQuery = (salesOperationId, mentorMenteeSessionId) => `
mutation{
  addToSalesOperationFirstMentorMenteeSession(
    salesOperationId: "${salesOperationId}"
    mentorMenteeSessionId:"${mentorMenteeSessionId}"
  ){
    fieldName
    connectedTypeName
    connectedFieldName
  }
}
`;

const addToSalesOperationScript = async (type) => {
  const mentorMenteeSessions = await callLocalGraphqlApi(mentorMenteeSessionsQuery());
  const mentorMenteeSessionsArray = get(mentorMenteeSessions, 'data.mentorMenteeSessions', []);
  const mentorMenteeMapping = {};
  const mentorMenteeSessionAndMenteeMapping = {};
  mentorMenteeSessionsArray.forEach((mms) => {
    const { id: mentorMenteeSessionId, mentorSession, menteeSession } = mms;
    const mentorUserId = get(mentorSession, 'user.id');
    const menteeUserId = get(menteeSession, 'user.id');
    if (mentorUserId && menteeUserId) {
      mentorMenteeMapping[menteeUserId] = mentorUserId;
      mentorMenteeSessionAndMenteeMapping[menteeUserId] = mentorMenteeSessionId;
    }
  });
  //-----------------------
  const salesOperationClientMapping = {};
  const salesOperations = await callLocalGraphqlApi(salesOperationsQuery());
  const salesOperationsArray = get(salesOperations, 'data.salesOperations', []);
  salesOperationsArray.forEach((so) => {
    const { id: salesOperationId, client } = so;
    const clientId = get(client, 'id');
    if (clientId) {
      salesOperationClientMapping[clientId] = salesOperationId;
    }
  });
  //-----------------------
  const salesOperationKeys = Object.keys(salesOperationClientMapping);
  // eslint-disable-next-line no-restricted-syntax
  for (const key of salesOperationKeys) {
    if (mentorMenteeMapping[key]) {
      if (type === 'firstMentorMenteeSession') {
        try {
          const query = addToSalesOperationFirstMentorMenteeSessionQuery(
            salesOperationClientMapping[key],
            mentorMenteeSessionAndMenteeMapping[key],
          );
          // eslint-disable-next-line no-await-in-loop
          const res = await callLocalGraphqlApi(query);
          // eslint-disable-next-line no-console
          console.log(res);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(e);
        }
      } else if (type === 'allottedMentor') {
        try {
          const query = addToSalesOperationAllottedMentorQuery(salesOperationClientMapping[key], mentorMenteeMapping[key]);
          // eslint-disable-next-line no-await-in-loop
          const res = await callLocalGraphqlApi(query);
          // eslint-disable-next-line no-console
          console.log(res);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(e);
        }
      }
    }
  }
};

export default addToSalesOperationScript;
