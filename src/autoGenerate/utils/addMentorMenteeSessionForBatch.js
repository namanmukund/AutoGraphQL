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
  mentorSessionId,
  variables,
) => {
  const query = `
mutation($input: MentorMenteeSessionUpdate){
  updateMentorMenteeSession(
    id:"${mentorMenteeId}"
    ${!mentorSessionId ? '' : `mentorSessionConnectId: "${mentorSessionId}"`}
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

const getMenteeSession = async (
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
    bookingDate
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.menteeSessions[0]');
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

const addMentorMenteeSessionForBatch = async (menteeUserId, mentorUserId, topicId, bookingDate, slot, mentorSessionIdFromInput, courseId, sessionStatus, source, methodCallOriginComponent, toUpdateMenteeSession) => {
  const menteBookingDate = bookingDate;
  const menteeBookingSlot = slot;
  let menteeSessionId;
  if (menteeUserId) {
    const menteeSession = await getMenteeSession(
      menteeUserId,
      topicId,
    );
    if (menteeSession) {
      const { id: menteeSessionIdFromMenteeQuery } = menteeSession;
      menteeSessionId = menteeSessionIdFromMenteeQuery;
    }
    console.log('------------------------menteeSessionId', menteeSessionId);
  }
  let mentorSessionId = mentorSessionIdFromInput;
  // eslint-disable-next-line no-restricted-syntax
  try {
    console.log('------------------------menteeUserId', menteeUserId);
    console.log('------------------------mentorUserId', mentorUserId);
    console.log('------------------------topicId', topicId);
    console.log('------------------------bookingDate', bookingDate);
    console.log('------------------------slot', slot);
    console.log('------------------------mentorSessionIdFromInput', mentorSessionIdFromInput);
    console.log('------------------------courseId', courseId);
    console.log('------------------------sessionStatus', sessionStatus);
    console.log('------------------------source', source);
    console.log('------------------------methodCallOriginComponent', methodCallOriginComponent);

    // simply update existing mms if that's all it is to be done
    if (menteeUserId && topicId) {
      const mentorMenteeId = await callMentorMenteeSessions(menteeUserId, topicId);
      if (mentorMenteeId) {
        if (toUpdateMenteeSession && menteeSessionId) {
          const variables = {
            input: {
              bookingDate: menteBookingDate,
              slot0: `slot${menteeBookingSlot}` === 'slot0',
              slot1: `slot${menteeBookingSlot}` === 'slot1',
              slot2: `slot${menteeBookingSlot}` === 'slot2',
              slot3: `slot${menteeBookingSlot}` === 'slot3',
              slot4: `slot${menteeBookingSlot}` === 'slot4',
              slot5: `slot${menteeBookingSlot}` === 'slot5',
              slot6: `slot${menteeBookingSlot}` === 'slot6',
              slot7: `slot${menteeBookingSlot}` === 'slot7',
              slot8: `slot${menteeBookingSlot}` === 'slot8',
              slot9: `slot${menteeBookingSlot}` === 'slot9',
              slot10: `slot${menteeBookingSlot}` === 'slot10',
              slot11: `slot${menteeBookingSlot}` === 'slot11',
              slot12: `slot${menteeBookingSlot}` === 'slot12',
              slot13: `slot${menteeBookingSlot}` === 'slot13',
              slot14: `slot${menteeBookingSlot}` === 'slot14',
              slot15: `slot${menteeBookingSlot}` === 'slot15',
              slot16: `slot${menteeBookingSlot}` === 'slot16',
              slot17: `slot${menteeBookingSlot}` === 'slot17',
              slot18: `slot${menteeBookingSlot}` === 'slot18',
              slot19: `slot${menteeBookingSlot}` === 'slot19',
              slot20: `slot${menteeBookingSlot}` === 'slot20',
              slot21: `slot${menteeBookingSlot}` === 'slot21',
              slot22: `slot${menteeBookingSlot}` === 'slot22',
              slot23: `slot${menteeBookingSlot}` === 'slot23',
            },
          };
          await callUpdateMenteeSession(
            menteeSessionId,
            variables,
          );
          console.log('------------------------updated menteeSessionId', menteeSessionId);
        }
        await callUpdateMentorMenteeSession(mentorMenteeId, mentorSessionIdFromInput, { input: { sessionStatus } });
        console.log('------------------------updated mentorMenteeId', mentorMenteeId);
        return true;
      }
    }

    // add mentor session if mentorSessionId is not present in input
    if (!mentorSessionId && mentorUserId) {
      mentorSessionId = await getMentorSessionId(
        mentorUserId,
        menteBookingDate,
        `slot${menteeBookingSlot}`,
      );
      console.log('------------------------111 mentorSessionId', mentorSessionId);
      if (!mentorSessionId) {
        console.log('------------------------adding mentorSessionId');
        const variables = {
          input: {
            availabilityDate: menteBookingDate,
            [`slot${menteeBookingSlot}`]: true,
            sessionType: 'batch',
          },
        };
        mentorSessionId = await callAddMentorSession(mentorUserId, courseId, variables);
        console.log('------------------------added mentorSessionId', mentorSessionId);
      } else {
        // update
        const variables = {
          input: {
            availabilityDate: menteBookingDate,
            [`slot${menteeBookingSlot}`]: true,
            sessionType: 'batch',
          },
        };

        try {
          await callUpdateMentorSession(
            mentorSessionId,
            variables,
          );
        } catch (err) {
          console.log(`Mentor session update failed for mentorSessionId: ${mentorSessionId}`);
        }
        console.log('------------------------updated mentorSessionId', mentorSessionId);
      }
    } else {
      console.log('------------------------updated existing mentorSessionId', mentorSessionId);
      const variables = {
        input: {
          availabilityDate: menteBookingDate,
          [`slot${menteeBookingSlot}`]: true,
          sessionType: 'batch',
        },
      };
      try {
        await callUpdateMentorSession(
          mentorSessionId,
          variables,
        );
      } catch (err) {
        console.log(`Mentor session update failed for mentorSessionId: ${mentorSessionId}`);
      }
    }


    if (menteeSessionId) {
      console.log('------------------------updating menteeSessionId', menteeSessionId);
      // update
      const variables = {
        input: {
          bookingDate: menteBookingDate,
          slot0: `slot${menteeBookingSlot}` === 'slot0',
          slot1: `slot${menteeBookingSlot}` === 'slot1',
          slot2: `slot${menteeBookingSlot}` === 'slot2',
          slot3: `slot${menteeBookingSlot}` === 'slot3',
          slot4: `slot${menteeBookingSlot}` === 'slot4',
          slot5: `slot${menteeBookingSlot}` === 'slot5',
          slot6: `slot${menteeBookingSlot}` === 'slot6',
          slot7: `slot${menteeBookingSlot}` === 'slot7',
          slot8: `slot${menteeBookingSlot}` === 'slot8',
          slot9: `slot${menteeBookingSlot}` === 'slot9',
          slot10: `slot${menteeBookingSlot}` === 'slot10',
          slot11: `slot${menteeBookingSlot}` === 'slot11',
          slot12: `slot${menteeBookingSlot}` === 'slot12',
          slot13: `slot${menteeBookingSlot}` === 'slot13',
          slot14: `slot${menteeBookingSlot}` === 'slot14',
          slot15: `slot${menteeBookingSlot}` === 'slot15',
          slot16: `slot${menteeBookingSlot}` === 'slot16',
          slot17: `slot${menteeBookingSlot}` === 'slot17',
          slot18: `slot${menteeBookingSlot}` === 'slot18',
          slot19: `slot${menteeBookingSlot}` === 'slot19',
          slot20: `slot${menteeBookingSlot}` === 'slot20',
          slot21: `slot${menteeBookingSlot}` === 'slot21',
          slot22: `slot${menteeBookingSlot}` === 'slot22',
          slot23: `slot${menteeBookingSlot}` === 'slot23',
        },
      };
      await callUpdateMenteeSession(
        menteeSessionId,
        variables,
      );
      console.log('------------------------updated menteeSessionId', menteeSessionId);
    } else if (!menteeSessionId) {
      // add mentee session
      /* eslint no-lonely-if:0 */
      if (menteBookingDate && menteeBookingSlot !== null && menteeBookingSlot !== undefined) {
        const variables = {
          input: {
            bookingDate: menteBookingDate,
            [`slot${menteeBookingSlot}`]: true,
            source: 'school',
          },
        };
        menteeSessionId = await callAddMenteeSession(menteeUserId, topicId, variables);
        console.log('------------------------added menteeSessionId', menteeSessionId);
      }
    }

    // add mentor mentee session
    if (menteeSessionId && mentorSessionId) {
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
      console.log('------------------------added mentorMenteeId');
    }
  } catch (e) {
    console.log('Error........', e);
  }
  return true;
};

export default addMentorMenteeSessionForBatch;
