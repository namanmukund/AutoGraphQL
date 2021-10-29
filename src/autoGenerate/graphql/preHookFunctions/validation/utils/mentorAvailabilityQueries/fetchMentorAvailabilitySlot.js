import { get } from 'lodash';
import getSlotTimesInString from '../../../../../../../utils/getSlotTimesInString';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const fetchMentorAvailabilitySlot = async (id) => {
  const query = `{
  mentorAvailabilitySlot(id: "${id}") {
    count
    id
    date
    slotName
    mentorSessionsMeta {
      count
    }
    broadCastedMentors {
      id
    }
  }
}`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.mentorAvailabilitySlot', {});
};

export const fetchMentorSessionsForSlot = async ({ date, mentorId, slotNumber }) => {
  const query = `{
    mentorSessions(
      filter: { and: [
      { availabilityDate: "${date}" },
      { sessionType: trial }
      ${mentorId ? `{ user_some: { id: "${mentorId}" } }` : ''}
      ${slotNumber ? `{ slot${slotNumber}: true }` : ''}
    ] }
    ) {
      id
      ${getSlotTimesInString()}
    }
  }`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.mentorSessions', []);
};

export const fetchMenteeSessionForDemand = async (menteeSessionId) => {
  const query = `{
  menteeSession(id: "${menteeSessionId}") {
    id
    bookingDate
    mentorAvailabilitySlot {
      id
    }
    broadCastedMentors {
      id
    }
  }
}`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.menteeSession', {});
};

export const fetchMentorMenteeSessionForMenteeSession = async (menteeSessionId) => {
  const query = `{
  mentorMenteeSessions(filter: { menteeSession_some: { id: "${menteeSessionId}" } }) {
    id
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.mentorMenteeSessions', []);
};

export default fetchMentorAvailabilitySlot;
