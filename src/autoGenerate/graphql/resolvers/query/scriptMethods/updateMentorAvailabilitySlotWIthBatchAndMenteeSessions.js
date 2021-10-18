/* eslint-disable no-await-in-loop, no-console, no-restricted-syntax */

import { get } from 'lodash';
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
    batchSessions(filter: { topic_some: { order: 1 } }){
        id
        batch{
          type
        }
        ${getSlotTimesInString()}
    }
    mentorMenteeSessions(
      filter: {
        and: [
          { studentProfile_some: { batch_exists: false } }
          { source_not: school }
          { topic_some: { order: 1 } }
        ]
      }
    ) {
      id
      menteeSession {
        id
        ${getSlotTimesInString()}
      }
    }
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
      verticals{
        value
      }
    }
    }`;
  const mentorAvailabilitySlotData = await callLocalGraphqlApi(query);
  return get(mentorAvailabilitySlotData, 'data.mentorAvailabilitySlots');
};

export const updateMentorAvailabilitySlot = async (mentorAvailabilitySlotId, sessionId, type, mentorProfileId, input = {}, mentorMenteeSessionId) => {
  const query = `mutation($input: MentorAvailabilitySlotUpdate) {
    updateMentorAvailabilitySlot(id: "${mentorAvailabilitySlotId}",
    ${type === 'menteeSession' ? `menteeSessionsConnectIds: ["${sessionId}"]` : ''}
    ${mentorProfileId ? `broadCastedMentorsConnectIds: ["${mentorProfileId}"]` : ''}
    ${type === 'batchSession' ? `batchSessionsConnectIds: ["${sessionId}"]` : ''}
    ${mentorMenteeSessionId ? `mentorMenteeSessionsConnectIds: ["${mentorMenteeSessionId}"]` : ''}
    input:$input
    ) {
      id
    }
  }`;
  const result = await callLocalGraphqlApi(query, '', { input });
  return get(result, 'data.updateMentorAvailabilitySlot');
};

const updateMentorAvailabilitySlotWithBatchAndMenteeSessions = async () => {
  const mentorSessions = await getMentorSessions();
  if (mentorSessions && mentorSessions.length > 0) {
    for (const mentorSession of mentorSessions) {
      const { availabilityDate } = mentorSession;
      if (get(mentorSession, 'user.mentorProfile')) {
        const batchSessions = get(mentorSession, 'batchSessions', []);
        const mentorMenteesessions = get(mentorSession, 'mentorMenteeSessions', []);
        if (batchSessions && batchSessions.length > 0) {
          for (const batchSession of batchSessions) {
            if (get(batchSession, 'id')) {
              const slotsArray = getSelectedSlotsStringArray(batchSession);
              if (slotsArray.length > 0) {
                const mentorAvailabilitySlot = await getMentorAvailabilitySlots({ date: availabilityDate, slotName: get(slotsArray, '[0]') });
                if (mentorAvailabilitySlot && mentorAvailabilitySlot.length > 0) {
                  const slotVerticals = get(mentorAvailabilitySlot, '[0].verticals', []);
                  const addedVerticals = slotVerticals.map((vertical) => get(vertical, 'value'));
                  const batchType = get(batchSession, 'batch.type');
                  if (batchType && batchType !== 'normal' && !addedVerticals.includes(batchType)) {
                    slotVerticals.push({ value: batchType });
                  }
                  await updateMentorAvailabilitySlot(get(mentorAvailabilitySlot, '[0].id'), get(batchSession, 'id'), 'batchSession',
                    get(mentorSession, 'user.mentorProfile.id'), {
                      verticals: {
                        replace: slotVerticals,
                      },
                    });
                  console.log(`update mentorAvailabilitySlot for ${get(slotsArray, '[0]')} with batchSession ${get(batchSession, 'id')}`);
                }
              }
            }
          }
        }
        if (mentorMenteesessions && mentorMenteesessions.length > 0) {
          for (const mentorMenteesession of mentorMenteesessions) {
            if (get(mentorMenteesession, 'menteeSession.id')) {
              const slotsArray = getSelectedSlotsStringArray(get(mentorMenteesession, 'menteeSession'));
              if (slotsArray.length > 0) {
                const mentorAvailabilitySlot = await getMentorAvailabilitySlots({ date: availabilityDate, slotName: get(slotsArray, '[0]') });
                if (mentorAvailabilitySlot && mentorAvailabilitySlot.length > 0) {
                  await updateMentorAvailabilitySlot(get(mentorAvailabilitySlot, '[0].id'), get(mentorMenteesession, 'menteeSession.id'),
                    'menteeSession',
                    get(mentorSession, 'user.mentorProfile.id'), {}, get(mentorMenteesession, 'id'));
                  console.log(`update mentorAvailabilitySlot for ${get(slotsArray, '[0]')} with menteeSession ${get(mentorMenteesession, 'menteeSession.id')} and mentorMenteeSession ${get(mentorMenteesession, 'id')}`);
                }
              }
            }
          }
        }
      }
    }
  }
};

export default updateMentorAvailabilitySlotWithBatchAndMenteeSessions;
