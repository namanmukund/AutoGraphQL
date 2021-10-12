import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

export const getMentorAvailabilitySlots = async ({
  date, sessionType, slotName, sessionId, typeName,
}) => {
  const query = `{
    mentorAvailabilitySlots(
        filter: { and: [
            ${date ? `{ date: "${date}" }` : ''},
            ${sessionType ? `{ sessionType: ${sessionType} }` : ''},
            ${slotName ? `{ slotName: ${slotName} }` : ''}
            ${typeName === 'mentorSession' && sessionId ? `{ mentorSessions_some: { id: "${sessionId}" } }` : ''}
            ${typeName === 'menteeSession' && sessionId ? `{ menteeSessions_some: { id: "${sessionId}" } }` : ''}
            ${typeName === 'batchSession' && sessionId ? `{ batchSessions_some: { id: "${sessionId}" } }` : ''}
        ] }
    ) {
        id
        count
        verticals{
          value
        }
    }
    }`;
  const mentorAvailabilitySlotData = await callLocalGraphqlApi(query);
  return get(mentorAvailabilitySlotData, 'data.mentorAvailabilitySlots');
};

const getMentorDemandSlot = async (date) => {
  const query = `{
    mentorDemandSlots(filter: { date: "${date}" }) {
      id
    }
  }
  `;
  const mentorDemandSlot = await callLocalGraphqlApi(query);
  return get(mentorDemandSlot, 'data.mentorDemandSlots');
};

const updateMentorDemandSlot = async (id, slotId, mentorProfileId, input) => {
  const mutationQuery = `mutation {
    updateMentorDemandSlot(id: "${id}", 
    slotsConnectIds: ["${slotId}"],
    ${mentorProfileId ? `broadCastedMentorsConnectIds: ["${mentorProfileId}"]` : ''}
    ) {
      id
    }
  }`;
  const updateMentorDemandSlotData = await callLocalGraphqlApi(mutationQuery, '', { input });
  return get(updateMentorDemandSlotData, 'data.updateMentorDemandSlot');
};

const addMentorDemandSlot = async (slotId, mentorProfileId, input) => {
  const mutationQuery = `mutation($input: MentorDemandSlotInput!) {
  addMentorDemandSlot(
    input: $input
    slotsConnectIds: ["${slotId}"],
    ${mentorProfileId ? `broadCastedMentorsConnectIds: ["${mentorProfileId}"]` : ''}
  ) {
    id
  }
}
`;
  const addMentorDemandSlotData = await callLocalGraphqlApi(mutationQuery, '', { input });
  return get(addMentorDemandSlotData, 'data.addMentorDemandSlot');
};

const addMentorAvailabilitySlot = async (sessionId, mentorProfileId, paySlabId, input, type) => {
  const mutationQuery = `mutation($input: MentorAvailabilitySlotInput!) {
    addMentorAvailabilitySlot(input: $input,
    ${type === 'menteeSession' ? `menteeSessionsConnectIds: ["${sessionId}"]` : ''}
    ${type === 'mentorSession' ? `mentorSessionsConnectIds: ["${sessionId}"]` : ''}
    ${type === 'batchSession' ? `batchSessionsConnectIds: ["${sessionId}"]` : ''}
    ${paySlabId ? `paySlabConnectId: "${paySlabId}"` : ''}
    ${mentorProfileId ? `broadCastedMentorsConnectIds: ["${mentorProfileId}"]` : ''}) {
      id
    }
  }`;
  const addMentorAvailabilitySlotData = await callLocalGraphqlApi(mutationQuery, '', { input });
  return get(addMentorAvailabilitySlotData, 'data.addMentorAvailabilitySlot');
};

export const updateMentorAvailabilitySlot = async (mentorAvailabilitySlotId, sessionId, type, mentorProfileId, input = {}) => {
  const query = `mutation($input: MentorAvailabilitySlotUpdate) {
    updateMentorAvailabilitySlot(id: "${mentorAvailabilitySlotId}",
    ${type === 'menteeSession' ? `menteeSessionsConnectIds: ["${sessionId}"]` : ''}
    ${type === 'mentorSession' ? `mentorSessionsConnectIds: ["${sessionId}"], 
    ${mentorProfileId ? `broadCastedMentorsConnectIds: ["${mentorProfileId}"]` : ''}` : ''}
    ${type === 'batchSession' ? `batchSessionsConnectIds: ["${sessionId}"]` : ''}
    input:$input
    ) {
      id
    }
  }`;
  const result = await callLocalGraphqlApi(query, '', { input });
  return get(result, 'data.updateMentorAvailabilitySlot');
};

const getPaySlabDetails = async () => {
  const query = `{
  mentorSupplyPaySlabs {
    id
  }
}`;
  const paySlab = await callLocalGraphqlApi(query);
  return get(paySlab, 'data.mentorSupplyPaySlabs');
};

export const removeFromMentorAvailabilitySlot = async (mentorAvailabilitySlotId, sessionId, type) => {
  const query = `mutation{
    ${type === 'menteeSession' ? `removeFromMentorAvailabilitySlotMenteeSession(
    mentorAvailabilitySlotId: "${mentorAvailabilitySlotId}"
    menteeSessionId: "${sessionId}"
  ) {
    mentorAvailabilitySlot {
      id
    }
  }` : ''}
  ${type === 'mentorSession' ? `removeFromMentorAvailabilitySlotMentorSession(
    mentorAvailabilitySlotId: "${mentorAvailabilitySlotId}"
    mentorSessionId: "${sessionId}"
  ) {
    mentorAvailabilitySlot {
      id
    }
  }` : ''}
  ${type === 'batchSession' ? `removeFromMentorAvailabilitySlotBatchSession(
    mentorAvailabilitySlotId: "${mentorAvailabilitySlotId}"
    batchSessionId: "${sessionId}"
  ) {
    mentorAvailabilitySlot {
      id
    }
  }` : ''}
  }`;
  await callLocalGraphqlApi(query);
};

const addUpdateMentorAvailabilitySlots = async ({
  singleSlotData, mentorProfileId, sessionId, date, slotName, sessionType, typeName,
}) => {
  // if singleSlot exist for give slotName, date and sessionType then update with sessionId
  if (singleSlotData && singleSlotData.length > 0) {
    await updateMentorAvailabilitySlot(get(singleSlotData, '[0].id'), sessionId, typeName, mentorProfileId);
    // if (typeName === 'batchSession') {
    //   const slotVerticals = get(singleSlotData, '[0].verticals', []);
    //   const addedVerticals = slotVerticals.map((vertical) => get(vertical, 'value'));
    //   if (!addedVerticals.includes('b2b2c')) {
    //     slotVerticals.push({ value: 'b2b2c' });
    //   }
    //   await updateMentorAvailabilitySlot(get(singleSlotData, '[0].id'), sessionId, typeName, mentorProfileId, {
    //     verticals: {
    //       replace: slotVerticals,
    //     },
    //   });
    // } else {
    //   await updateMentorAvailabilitySlot(get(singleSlotData, '[0].id'), sessionId, typeName, mentorProfileId);
    // }
  } else {
    const paySlab = await getPaySlabDetails();
    const paySlabId = get(paySlab, '[0].id');
    let vertical = 'b2c';
    if (typeName === 'batchSession') vertical = 'b2b2c';
    const input = {
      date: `${date}`,
      verticals: [{ value: vertical }],
      slotName,
      countries: [{ value: 'india' }],
      count: 1,
      sessionType,
    };
    // else add new singleSlot
    const addSingleSlot = await addMentorAvailabilitySlot(sessionId, mentorProfileId, paySlabId, input, typeName);
    const mentorDemandSlotData = await getMentorDemandSlot(date);
    // check if mentorDemandSlot exist for the give date and accordingly add or update it.
    if (mentorDemandSlotData && mentorDemandSlotData.length > 0) {
      const mentorDemandSlotId = get(mentorDemandSlotData, '[0].id');
      await updateMentorDemandSlot(mentorDemandSlotId, get(addSingleSlot, 'id'), mentorProfileId, {});
    } else {
      await addMentorDemandSlot(get(addSingleSlot, 'id'), mentorProfileId, {
        date: `${date}`,
        verticals: [{ value: vertical }],
        sessionType,
      });
    }
  }
};

const mentorAvailabilitySlotOperation = async ({
  slotTimeStringArray, date, sessionType, mutationName, sessionId, prevMentorAvailabilitySlot, mentorProfileId,
}) => {
  for (let i = 0; i < slotTimeStringArray.length; i += 1) {
    /* eslint-disable no-await-in-loop */
    if (mutationName) {
      const singleSlotData = await getMentorAvailabilitySlots({ date, sessionType, slotName: slotTimeStringArray[i] });
      switch (mutationName) {
        case 'addMenteeSession': {
          if (singleSlotData && singleSlotData.length > 0) {
            await updateMentorAvailabilitySlot(get(singleSlotData, '[0].id'), sessionId, 'menteeSession');
          }
          break;
        }
        case 'updateMenteeSession': {
          if (prevMentorAvailabilitySlot) {
            await removeFromMentorAvailabilitySlot(prevMentorAvailabilitySlot, sessionId, 'menteeSession');
          }
          if (singleSlotData && singleSlotData.length > 0) {
            await updateMentorAvailabilitySlot(get(singleSlotData, '[0].id'), sessionId, 'menteeSession');
          }
          break;
        }
        case 'addMentorSession': {
          await addUpdateMentorAvailabilitySlots({
            date, sessionId, sessionType, slotName: slotTimeStringArray[i], singleSlotData, mentorProfileId, typeName: 'mentorSession',
          });
          break;
        }
        case 'updateMentorSession': {
          await addUpdateMentorAvailabilitySlots({
            date, sessionId, sessionType, slotName: slotTimeStringArray[i], singleSlotData, mentorProfileId, typeName: 'mentorSession',
          });
          break;
        }
        case 'addBatchSession': {
          if (singleSlotData && singleSlotData.length > 0) {
            const slotVerticals = get(singleSlotData, '[0].verticals', []);
            const addedVerticals = slotVerticals.map((vertical) => get(vertical, 'value'));
            if (!addedVerticals.includes('b2b2c')) {
              slotVerticals.push({ value: 'b2b2c' });
            }
            await updateMentorAvailabilitySlot(get(singleSlotData, '[0].id'), sessionId, 'batchSession', mentorProfileId, {
              verticals: {
                replace: slotVerticals,
              },
            });
          }
          break;
        }
        case 'updateBatchSession': {
          if (prevMentorAvailabilitySlot) {
            await removeFromMentorAvailabilitySlot(prevMentorAvailabilitySlot, sessionId, 'batchSession');
          }
          if (singleSlotData && singleSlotData.length > 0) {
            const slotVerticals = get(singleSlotData, '[0].verticals', []);
            const addedVerticals = slotVerticals.map((vertical) => get(vertical, 'value'));
            if (!addedVerticals.includes('b2b2c')) {
              slotVerticals.push({ value: 'b2b2c' });
            }
            await updateMentorAvailabilitySlot(get(singleSlotData, '[0].id'), sessionId, 'batchSession', mentorProfileId, {
              verticals: {
                replace: slotVerticals,
              },
            });
          }
          break;
        }
        default:
          break;
      }
    }
  }
};

export default mentorAvailabilitySlotOperation;
