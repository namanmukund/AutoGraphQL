import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

export const getMentorDemandSingleSlot = async ({
  date, sessionType, slotName, mentorSessionId,
}) => {
  const query = `{
    mentorDemandSingleSlots(
        filter: { and: [
            ${date ? `{ date: "${date}" }` : ''},
            ${sessionType ? `{ sessionType: ${sessionType} }` : ''},
            ${slotName ? `{ slotName: ${slotName} }` : ''}
            ${mentorSessionId ? `{ mentorSessions_some: { id: "${mentorSessionId}" } }` : ''}
        ] }
    ) {
        id
        count
        verticals{
          value
        }
    }
    }`;
  const mentorDemandSingleSlotData = await callLocalGraphqlApi(query);
  return get(mentorDemandSingleSlotData, 'data.mentorDemandSingleSlots');
};

const getMentorMentorDemandSlot = async (date) => {
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

const addMentorDemandSingleSlot = async (sessionId, mentorProfileId, paySlabId, input) => {
  const mutationQuery = `mutation($input: MentorDemandSingleSlotInput!) {
    addMentorDemandSingleSlot(input: $input, mentorSessionsConnectIds: ["${sessionId}"],
    ${paySlabId ? `paySlabConnectId: "${paySlabId}"` : ''}
    ${mentorProfileId ? `broadCastedMentorsConnectIds: ["${mentorProfileId}"]` : ''}) {
      id
    }
  }`;
  const addMentorDemandSingleSlotData = await callLocalGraphqlApi(mutationQuery, '', { input });
  return get(addMentorDemandSingleSlotData, 'data.addMentorDemandSingleSlot');
};

const updateMentorDemandSingleSlot = async (mentorDemandSingleSlotId, sessionId, type, mentorProfileId, input = {}) => {
  const query = `mutation($input: MentorDemandSingleSlotUpdate) {
    updateMentorDemandSingleSlot(id: "${mentorDemandSingleSlotId}",
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
  return get(result, 'data.updateMentorDemandSingleSlot');
};

const getPaySlabDetails = async () => {
  const query = `{
  mentorSupplyPaySlabs(filter: { vertical: b2c }) {
    id
  }
}`;
  const paySlab = await callLocalGraphqlApi(query);
  return get(paySlab, 'data.mentorSupplyPaySlabs');
};

export const removeLinkedFromMentorDemandSlot = async (mentorDemandSingleSlotId, sessionId, type) => {
  const query = `mutation{
    ${type === 'menteeSession' ? `removeFromMentorDemandSingleSlotMenteeSession(
    mentorDemandSingleSlotId: "${mentorDemandSingleSlotId}"
    menteeSessionId: "${sessionId}"
  ) {
    mentorDemandSingleSlot {
      id
    }
  }` : ''}
  ${type === 'mentorSession' ? `removeFromMentorDemandSingleSlotMentorSession(
    mentorDemandSingleSlotId: "${mentorDemandSingleSlotId}"
    mentorSessionId: "${sessionId}"
  ) {
    mentorDemandSingleSlot {
      id
    }
  }` : ''}
  ${type === 'batchSession' ? `removeFromMentorDemandSingleSlotBatchSession(
    mentorDemandSingleSlotId: "${mentorDemandSingleSlotId}"
    batchSessionId: "${sessionId}"
  ) {
    mentorDemandSingleSlot {
      id
    }
  }` : ''}
  }`;
  await callLocalGraphqlApi(query);
};

const mentorSessionOperation = async ({
  singleSlotData, mentorProfileId, sessionId, date, slotName, sessionType, typeName,
}) => {
  // if singleSlot exist for give slotName, date and sessionType then update with mentorSessionId
  if (singleSlotData && singleSlotData.length > 0) {
    if (typeName === 'batchSession') {
      const slotVerticals = get(singleSlotData, '[0].verticals', []);
      let count = get(singleSlotData, '[0].count', 0);
      const addedVerticals = slotVerticals.map((vertical) => get(vertical, 'value'));
      if (!addedVerticals.includes('b2b2c')) {
        count += 1;
        slotVerticals.push({ value: 'b2b2c' });
      }
      await updateMentorDemandSingleSlot(get(singleSlotData, '[0].id'), sessionId, typeName, mentorProfileId, {
        verticals: {
          replace: slotVerticals,
        },
        count,
      });
    } else {
      await updateMentorDemandSingleSlot(get(singleSlotData, '[0].id'), sessionId, typeName, mentorProfileId);
    }
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
    const addSingleSlot = await addMentorDemandSingleSlot(sessionId, mentorProfileId, paySlabId, input);
    const mentorDemandSlotData = await getMentorMentorDemandSlot(date);
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

const mentorDemandSingleSlotOperations = async ({
  slotTimeStringArray, date, sessionType, mutationName, sessionId, prevMentorDemandSlotId, mentorProfileId,
}) => {
  for (let i = 0; i < slotTimeStringArray.length; i += 1) {
    /* eslint-disable no-await-in-loop */
    if (mutationName) {
      const singleSlotData = await getMentorDemandSingleSlot({ date, sessionType, slotName: slotTimeStringArray[i] });
      switch (mutationName) {
        case 'addMenteeSession': {
          if (singleSlotData && singleSlotData.length > 0) {
            await updateMentorDemandSingleSlot(get(singleSlotData, '[0].id'), sessionId, 'menteeSession');
          }
          break;
        }
        case 'updateMenteeSession': {
          if (singleSlotData && singleSlotData.length > 0) {
            if (prevMentorDemandSlotId) {
              await removeLinkedFromMentorDemandSlot(prevMentorDemandSlotId, sessionId, 'menteeSession');
            }
            await updateMentorDemandSingleSlot(get(singleSlotData, '[0].id'), sessionId, 'menteeSession');
          }
          break;
        }
        case 'addMentorSession': {
          await mentorSessionOperation({
            date, sessionId, sessionType, slotName: slotTimeStringArray[i], singleSlotData, mentorProfileId, typeName: 'mentorSession',
          });
          break;
        }
        case 'updateMentorSession': {
          await mentorSessionOperation({
            date, sessionId, sessionType, slotName: slotTimeStringArray[i], singleSlotData, mentorProfileId, typeName: 'mentorSession',
          });
          break;
        }
        case 'addBatchSession': {
          await mentorSessionOperation({
            date, sessionId, sessionType, slotName: slotTimeStringArray[i], singleSlotData, mentorProfileId, typeName: 'batchSession',
          });
          break;
        }
        case 'updateBatchSession': {
          if (singleSlotData && singleSlotData.length > 0) {
            if (prevMentorDemandSlotId) {
              await removeLinkedFromMentorDemandSlot(prevMentorDemandSlotId, sessionId, 'batchSession');
            }
            await mentorSessionOperation({
              date, sessionId, sessionType, slotName: slotTimeStringArray[i], singleSlotData, mentorProfileId, typeName: 'batchSession',
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

export default mentorDemandSingleSlotOperations;
