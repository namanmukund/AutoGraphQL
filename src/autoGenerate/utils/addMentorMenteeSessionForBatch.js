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
    let mentorSessionId = mentorSessionIdFromInput;
    if (menteeUserId) {
      menteeSessionId = await getMenteeSessionId(
        menteeUserId,
        topicId,
      );
      if (menteeSessionId) {
        // update
        const variables = {
          input: {
            bookingDate,
            slot0: `slot${slot}` === 'slot0',
            slot1: `slot${slot}` === 'slot1',
            slot2: `slot${slot}` === 'slot2',
            slot3: `slot${slot}` === 'slot3',
            slot4: `slot${slot}` === 'slot4',
            slot5: `slot${slot}` === 'slot5',
            slot6: `slot${slot}` === 'slot6',
            slot7: `slot${slot}` === 'slot7',
            slot8: `slot${slot}` === 'slot8',
            slot9: `slot${slot}` === 'slot9',
            slot10: `slot${slot}` === 'slot10',
            slot11: `slot${slot}` === 'slot11',
            slot12: `slot${slot}` === 'slot12',
            slot13: `slot${slot}` === 'slot13',
            slot14: `slot${slot}` === 'slot14',
            slot15: `slot${slot}` === 'slot15',
            slot16: `slot${slot}` === 'slot16',
            slot17: `slot${slot}` === 'slot17',
            slot18: `slot${slot}` === 'slot18',
            slot19: `slot${slot}` === 'slot19',
            slot20: `slot${slot}` === 'slot20',
            slot21: `slot${slot}` === 'slot21',
            slot22: `slot${slot}` === 'slot22',
            slot23: `slot${slot}` === 'slot23',
          },
        };
        await callUpdateMenteeSession(
          menteeSessionId,
          variables,
        );
      } else {
        // add mentee session
        /* eslint no-lonely-if:0 */
        if (bookingDate && slot) {
          const variables = {
            input: {
              bookingDate,
              [`slot${slot}`]: true,
              source: 'school',
            },
          };
          menteeSessionId = await callAddMenteeSession(menteeUserId, topicId, variables);
        }
      }
    }
    // add mentor  session
    if (!mentorSessionId && mentorUserId) {
      mentorSessionId = await getMentorSessionId(
        mentorUserId,
        bookingDate,
        `slot${slot}`,
      );
      if (!mentorSessionId) {
        const variables = {
          input: {
            availabilityDate: bookingDate,
            [`slot${slot}`]: true,
          },
        };
        mentorSessionId = await callAddMentorSession(mentorUserId, courseId, variables);
      } else {
        // update
        const variables = {
          input: {
            availabilityDate: bookingDate,
            [`slot${slot}`]: true,
          },
        };
        await callUpdateMentorSession(
          mentorSessionId,
          variables,
        );
      }
    } else {
      const variables = {
        input: {
          availabilityDate: bookingDate,
          [`slot${slot}`]: true,
        },
      };
      await callUpdateMentorSession(
        mentorSessionId,
        variables,
      );
    }
    // add mentor mentee session
    if (menteeSessionId && mentorSessionId) {
      const mentorMenteeId = await callMentorMenteeSessions(menteeUserId, topicId);
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
