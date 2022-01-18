/* eslint-disable no-await-in-loop, no-console */
import { get } from 'lodash';
import { log } from '../../../utils';
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
  context,
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
  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.updateMentorMenteeSession.id');
};

const callAddMenteeSession = async (
  userConnectId,
  topicConnectId,
  variables,
  courseConnectId,
  context,
) => {
  const query = `
mutation ($input: MenteeSessionInput!) {
  addMenteeSession(
    input: $input, 
    userConnectId: "${userConnectId}", 
    topicConnectId: "${topicConnectId}",
    ${courseConnectId ? `courseConnectId: "${courseConnectId}"` : ''}
  ) {
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, context, variables);
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
  context,
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
  const res = await callLocalGraphqlApi(query, context, variables);
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
  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.addMentorSession.id');
};

const callAddMentorMenteeSession = async (
  topicConnectId,
  menteeSessionConnectId,
  mentorSessionConnectId,
  variables,
  courseConnectId,
  context,
) => {
  const query = `
mutation($input: MentorMenteeSessionInput!){
  addMentorMenteeSession(
    input:$input
    topicConnectId:"${topicConnectId}"
    menteeSessionConnectId:"${menteeSessionConnectId}"
    ${mentorSessionConnectId ? `mentorSessionConnectId: "${mentorSessionConnectId}"` : ''}
    ${courseConnectId ? `courseConnectId: "${courseConnectId}"` : ''}
  ){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.addMentorMenteeSession.id');
};

const callUpdateMentorSession = async (
  mentorSessionId,
  variables,
  context,
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
  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.updateMentorSession.id');
};

const addMentorMenteeSessionForBatch = async (context, menteeUserId, mentorUserId, topicId, bookingDate, slot, mentorSessionIdFromInput, courseId, sessionStatus, source, methodCallOriginComponent, toUpdateMenteeSession) => {
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
    log(`------------------------menteeSessionId ${menteeSessionId}`);
  }
  let mentorSessionId = mentorSessionIdFromInput;
  // eslint-disable-next-line no-restricted-syntax
  try {
    log(`------------------------menteeUserId ${menteeUserId}`);
    log(`------------------------mentorUserId ${mentorUserId}`);
    log(`------------------------topicId ${topicId}`);
    log(`------------------------bookingDate ${bookingDate}`);
    log(`------------------------slot ${slot}`);
    log(`------------------------mentorSessionIdFromInput ${mentorSessionIdFromInput}`);
    log(`------------------------courseId ${courseId}`);
    log(`------------------------sessionStatus ${sessionStatus}`);
    log(`------------------------source ${source}`);
    log(`------------------------methodCallOriginComponent ${methodCallOriginComponent}`);

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
            context,
          );
          log(`------------------------updated menteeSessionId ${menteeSessionId}`);
        }
        if (toUpdateMenteeSession) {
          const variables = {
            input: {
              sessionStatus,
              source,
            },
          };
          // calling add MMSession as update MenteeSession deletes existing MMSession when date or slot are updated
          await callAddMentorMenteeSession(
            topicId,
            menteeSessionId,
            mentorSessionId,
            variables,
            courseId,
            context,
          );
          log('------------------------added mentorMenteeId after updating MenteeSession');
        } else {
          await callUpdateMentorMenteeSession(mentorMenteeId, mentorSessionIdFromInput, { input: { sessionStatus } });
          log(`------------------------updated mentorMenteeId ${mentorMenteeId}`);
        }
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
      log(`------------------------111 mentorSessionId ${mentorSessionId}`);
      if (!mentorSessionId) {
        log('------------------------adding mentorSessionId');
        const variables = {
          input: {
            availabilityDate: menteBookingDate,
            [`slot${menteeBookingSlot}`]: true,
            sessionType: 'batch',
          },
        };
        mentorSessionId = await callAddMentorSession(mentorUserId, courseId, variables, context);
        log(`------------------------added mentorSessionId ${mentorSessionId}`);
      } else {
        // update
        const variables = {
          input: {
            availabilityDate: menteBookingDate,
            [`slot${menteeBookingSlot}`]: true,
          },
        };

        try {
          await callUpdateMentorSession(
            mentorSessionId,
            variables,
            context,
          );
        } catch (err) {
          log(`Mentor session update failed for mentorSessionId: ${mentorSessionId}`);
        }
        log(`------------------------updated mentorSessionId ${mentorSessionId}`);
      }
    } else {
      log(`------------------------updated existing mentorSessionId ${mentorSessionId}`);
      const variables = {
        input: {
          availabilityDate: menteBookingDate,
          [`slot${menteeBookingSlot}`]: true,
        },
      };
      try {
        await callUpdateMentorSession(
          mentorSessionId,
          variables,
        );
      } catch (err) {
        log(`Mentor session update failed for mentorSessionId: ${mentorSessionId}`);
      }
    }
    if (menteeSessionId) {
      log(`------------------------updating menteeSessionId ${menteeSessionId}`);
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
        context,
      );
      log(`------------------------updated menteeSessionId ${menteeSessionId}`);
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
        menteeSessionId = await callAddMenteeSession(menteeUserId, topicId, variables, courseId, context);
        log(`------------------------added menteeSessionId ${menteeSessionId}`);
      }
    }

    // add mentor mentee session, made mentorSessionId non-mandatory
    if (menteeSessionId) {
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
        courseId,
        context,
      );
      log('------------------------added mentorMenteeId');
    }
  } catch (e) {
    log('In AddMentorMenteeSessionForBatch............');
    log(`Error........ ${e}`);
  }
  return true;
};

export default addMentorMenteeSessionForBatch;
