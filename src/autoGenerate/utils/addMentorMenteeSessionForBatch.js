/* eslint-disable no-await-in-loop, no-console */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';

const callMentorMenteeSessions = async (
  userId,
  topicId,
) => {
  const query = `
query{
  mentorMenteeSessions(filter:{
    and:[
    {topic_some:{id: "${topicId}"}}
    {menteeSession_some:{user_some:{id:"${userId}"}}}
    ]
  }){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorMenteeSessions[0].id');
};

const callUpdateMentorMenteeSession = async (
  mentorMenteeId,
  variables,
) => {
  const query = `
mutation($input: MentorMenteeSessionUpdate){
  updateMentorMenteeSession(
    id:"${mentorMenteeId}"
    input:$input
  ){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateMentorMenteeSession.id');
};

const callAddMenteeSession = async (
  userConnectId,
  topicConnectId,
  variables,
) => {
  const query = `
mutation ($input: MenteeSessionInput!) {
  addMenteeSession(
    input: $input, 
    userConnectId: "${userConnectId}", 
    topicConnectId: "${topicConnectId}"
  ) {
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.addMenteeSession.id');
};

const getMenteeSessionId = async (
  menteeUserId,
  topicId,
) => {
  const query = `
query {
  menteeSessions(filter:{
    and:[
      {user_some:{id:"${menteeUserId}"}}
      {topic_some:{ id: "${topicId}"}}
    ]
  }){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.menteeSessions[0].id');
};

const callUpdateMenteeSession = async (
  menteeSessionId,
  variables,
) => {
  const query = `
mutation($input: MenteeSessionUpdate){
  updateMenteeSession(
    id:"${menteeSessionId}",
    input:$input
  ){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateMenteeSession.id');
};

const getMentorSessionId = async (
  mentorUserId,
  availabilityDate,
) => {
  const query = `
query {
  mentorSessions(filter:{
    and:[
      {user_some:{id:"${mentorUserId}"}}
      {availabilityDate: "${availabilityDate}"}
    ]
  }){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorSessions[0].id');
};

const callAddMentorSession = async (
  userConnectId,
  courseConnectId,
  variables,
) => {
  const query = `
mutation ($input: MentorSessionInput!) {
  addMentorSession(input: $input, 
    userConnectId: "${userConnectId}", 
    courseConnectId: "${courseConnectId}"
  ) {
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.addMentorSession.id');
};

const callAddMentorMenteeSession = async (
  topicConnectId,
  menteeSessionConnectId,
  mentorSessionConnectId,
  variables,
) => {
  const query = `
mutation($input: MentorMenteeSessionInput!){
  addMentorMenteeSession(
    input:$input
    topicConnectId:"${topicConnectId}"
    menteeSessionConnectId:"${menteeSessionConnectId}"
    mentorSessionConnectId:"${mentorSessionConnectId}"
  ){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.addMentorMenteeSession.id');
};

const callUpdateMentorSession = async (
  mentorSessionId,
  variables,
) => {
  const query = `
mutation($input: MentorSessionUpdate){
  updateMentorSession(
    id:"${mentorSessionId}",
    input:$input
  ){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateMentorSession.id');
};

const addMentorMenteeSessionForBatch = async (menteeUserId, mentorUserId, topicId, bookingDate, slot, mentorSessionIdFromInput, courseId, sessionStatus, source) => {
  // eslint-disable-next-line no-restricted-syntax
  try {
    let menteeSessionId;
    let mentorSessionId;
    if (menteeUserId) {
      menteeSessionId = await getMenteeSessionId(
        menteeUserId,
        bookingDate,
        slot,
      );

      if (menteeSessionId) {
        // update
        const variables = {
          input: {
            bookingDate,
            [slot]: true,
          },
        };
        await callUpdateMenteeSession(
          menteeSessionId,
          variables,
        );
      } else {
        // add mentee session
        if (bookingDate && slot) {
          const variables = {
            input: {
              bookingDate,
              [slot]: true,
              source: 'school',
            },
          };
          menteeSessionId = await callAddMenteeSession(menteeUserId, topicId, variables);
          console.log('menteeSessionId....', menteeSessionId);
        }
      }
    }
    // add mentor  session
    if (!mentorSessionId && mentorUserId) {
      mentorSessionId = await getMentorSessionId(
        mentorUserId,
        bookingDate,
        slot,
      );
      if (!mentorSessionId) {
        const variables = {
          input: {
            availabilityDate: bookingDate,
            [slot]: true,
          },
        };
        mentorSessionId = await callAddMentorSession(mentorUserId, courseId, variables);
      } else {
        // update
        const variables = {
          input: {
            availabilityDate: bookingDate,
            [slot]: true,
          },
        };
        await callUpdateMentorSession(
          mentorSessionId,
          variables,
        );
      }
    }
    console.log('mentorSessionId....', mentorSessionId);
    // add mentor mentee session
    if (menteeSessionId && mentorSessionId) {
      const mentorMenteeId = await callMentorMenteeSessions(userId, topicId);
      console.log('*************mentorMenteeId', mentorMenteeId);
      if (mentorMenteeId) {
        await callUpdateMentorMenteeSession(mentorMenteeId, { input: { sessionStatus } });
      } else {
        const variables = {
          input: {
            sessionStatus,
            source,
          },
        };
        await callAddMentorMenteeSession(
          topicId,
          menteeSessionId,
          mentorSessionId,
          variables,
        );
      }
    }
  } catch (e) {
    console.log('Error........', e);
  }
  return true;
};

export default addMentorMenteeSessionForBatch;