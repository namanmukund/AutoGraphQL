/* eslint-disable no-await-in-loop, no-console */

import { get } from 'lodash';
import { sessionType } from '../../../../../../constants';
import getSlotTimesInString from '../../../../../../utils/getSlotTimesInString';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getSelectedSlotsStringArray from '../../../postHookFunctions/utils/getSelectedSlotsStringArray';

const getMentorSessions = async () => {
  const query = `{
  mentorSessions(
    filter: {
      and: [
        { sessionType: trial },
        { availabilityDate_gte: "${new Date(new Date().setHours(0, 0, 0, 0)).toISOString()}" },
        { mentorAvailabilitySlots_exists: false }
      ]
    }
  ) {
    id
    user {
      id
      mentorProfile {
        id
      }
    }
    availabilityDate
    ${getSlotTimesInString()}
  }
}
`;
  const mentorSessions = await callLocalGraphqlApi(query);
  return get(mentorSessions, 'data.mentorSessions', []);
};

const getMentorAvailabilitySlots = async ({
  date, slotName,
}) => {
  const query = `{
    mentorAvailabilitySlots(
        filter: { and: [
            { date: "${date}" }
            {sessionType: trial}
            { slotName: ${slotName} }
        ] }
    ) {
      id
    }
    }`;
  const mentorAvailabilitySlotData = await callLocalGraphqlApi(query);
  return get(mentorAvailabilitySlotData, 'data.mentorAvailabilitySlots');
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

const updateMentorDemandSlot = async (id, slotId, mentorProfileId) => {
  const mutationQuery = `mutation {
    updateMentorDemandSlot(id: "${id}", 
    slotsConnectIds: ["${slotId}"],
    ${mentorProfileId ? `broadCastedMentorsConnectIds: ["${mentorProfileId}"]` : ''}
    ) {
      id
    }
  }`;
  const updateMentorDemandSlotData = await callLocalGraphqlApi(mutationQuery, '');
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

const updateMentorAvailabilitySlot = async (mentorAvailabilitySlotId, mentorSessionId, mentorProfileId) => {
  const query = `mutation {
    updateMentorAvailabilitySlot(id: "${mentorAvailabilitySlotId}",
    mentorSessionsConnectIds: ["${mentorSessionId}"]
    broadCastedMentorsConnectIds: ["${mentorProfileId}"]
    ) {
      id
    }
  }`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.updateMentorAvailabilitySlot');
};

const addMentorAvailabilitySlot = async (mentorSessionId, mentorProfileId, paySlabId, input) => {
  const mutationQuery = `mutation($input: MentorAvailabilitySlotInput!) {
    addMentorAvailabilitySlot(input: $input,
    mentorSessionsConnectIds: ["${mentorSessionId}"]
    ${paySlabId ? `paySlabConnectId: "${paySlabId}"` : ''}
    ${mentorProfileId ? `broadCastedMentorsConnectIds: ["${mentorProfileId}"]` : ''}) {
      id
    }
  }`;
  const addMentorAvailabilitySlotData = await callLocalGraphqlApi(mutationQuery, '', { input });
  return get(addMentorAvailabilitySlotData, 'data.addMentorAvailabilitySlot');
};

const updateMentorAvailabilitySlotWithMentorSessions = async () => {
  const mentorSessions = await getMentorSessions();
  if (mentorSessions && mentorSessions.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const mentorSession of mentorSessions) {
      if (get(mentorSession, 'user.mentorProfile')) {
        const {
          id, availabilityDate, user, ...slots
        } = mentorSession;
        const mentorProfileId = get(mentorSession, 'user.mentorProfile.id');
        const slotTimeStringArray = getSelectedSlotsStringArray(slots);
        if (slotTimeStringArray.length > 0) {
          // eslint-disable-next-line no-restricted-syntax
          for (const slot of slotTimeStringArray) {
            // eslint-disable-next-line no-await-in-loop
            const mentorAvailabilitySlot = await getMentorAvailabilitySlots({ date: availabilityDate, slotName: slot });
            if (mentorAvailabilitySlot && mentorAvailabilitySlot.length > 0) {
              await updateMentorAvailabilitySlot(get(mentorAvailabilitySlot, '[0].id'), get(mentorSession, 'id'), mentorProfileId);
            } else {
              // else add new singleSlot
              const paySlab = await getPaySlabDetails();
              const paySlabId = get(paySlab, '[0].id');
              const vertical = 'b2c';
              const input = {
                date: `${availabilityDate}`,
                verticals: [{ value: vertical }],
                slotName: slot,
                countries: [{ value: 'india' }],
                count: 1,
                sessionType: sessionType.trial,
              };
              const addSingleSlot = await addMentorAvailabilitySlot(get(mentorSession, 'id'), mentorProfileId, paySlabId, input);
              const mentorDemandSlotData = await getMentorDemandSlot(availabilityDate);
              // check if mentorDemandSlot exist for the give date and accordingly add or update it.
              if (mentorDemandSlotData && mentorDemandSlotData.length > 0) {
                const mentorDemandSlotId = get(mentorDemandSlotData, '[0].id');
                await updateMentorDemandSlot(mentorDemandSlotId, get(addSingleSlot, 'id'), mentorProfileId);
              } else {
                await addMentorDemandSlot(get(addSingleSlot, 'id'), mentorProfileId, {
                  date: `${availabilityDate}`,
                  verticals: [{ value: vertical }],
                  sessionType: sessionType.trial,
                });
              }
            }
            console.log('updated mentorSessions => ', get(mentorSession, 'id'), ' for ', slot, ' on date ', availabilityDate);
          }
        }
      }
    }
  }
};

export default updateMentorAvailabilitySlotWithMentorSessions;
