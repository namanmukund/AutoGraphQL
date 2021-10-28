/* eslint-disable no-console */
import { get } from 'lodash';
import moment from 'moment';
import {
  LateToAcceptRequest, NotBroadcastedMentor,
  SessionAlreadyAssigned, SlotAlreadyFilled, SlotAlreadyOpened,
} from '../../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import fetchMentorAvailabilitySlot, {
  fetchMenteeSessionForDemand, fetchMentorMenteeSessionForMenteeSession, fetchMentorSessionsForSlot,
} from './mentorAvailabilityQueries/fetchMentorAvailabilitySlot';

const addAcceptedSlotRequestByMentorLogData = async (mentorProfileId, mentorAvailabilitySlotConnectId, input) => {
  const query = `mutation($input: AcceptedSlotRequestByMentorLogInput!) {
    addAcceptedSlotRequestByMentorLog(input: $input, mentorConnectId:"${mentorProfileId}", mentorAvailabilitySlotConnectId:"${mentorAvailabilitySlotConnectId}"){
        id
    }
    }`;
  const result = await callLocalGraphqlApi(query, '', { input });
  console.log('added logs', get(result, 'data.addAcceptedSlotRequestByMentorLog.id'));
  return get(result, 'data.addAcceptedSlotRequestByMentorLog');
};

const addAcceptedSlotRequestByMentorLogCheck = async ({
  acceptanceObject, mentorProfileId, mentorId, action,
}) => {
  const {
    mentorAvailabilitySlotId, slotName, date, requestType, menteeSessionId,
  } = acceptanceObject;
  const time = slotName.split('slot')[1];
  const startTime = moment(date).set('hours', time);
  let reason = '';
  const dateValue = new Date(new Date(date).setHours(0, 0, 0, 0)).toISOString();
  const acceptRequestInput = {
    date: dateValue,
    slotName,
    requestType,
    action,
  };
  if (requestType === 'supply') {
    const mentorAvailabilitySlot = await fetchMentorAvailabilitySlot(mentorAvailabilitySlotId);
    const broadCastedMentorsId = get(mentorAvailabilitySlot, 'broadCastedMentors', []).map((mentor) => get(mentor, 'id'));
    if (!broadCastedMentorsId.includes(mentorProfileId)) {
      reason = 'notBroadcastedMentor';
    }
    if (!moment().isBefore(startTime)) {
      reason = 'late';
    }
    if (get(mentorAvailabilitySlot, 'count', 0) <= get(mentorAvailabilitySlot, 'mentorSessionsMeta.count', 0)) {
      reason = 'alreadyFilled';
    }
    const mentorSessionsOfSlot = await fetchMentorSessionsForSlot({ date: dateValue, mentorId, slotNumber: time });
    if (mentorSessionsOfSlot && mentorSessionsOfSlot.length > 0) {
      reason = 'alreadyOpened';
    }
  } else if (requestType === 'demand') {
    if (menteeSessionId) {
      acceptRequestInput.action = 'addMentorMenteeSession';
      const menteeSessionsData = await fetchMenteeSessionForDemand(menteeSessionId);
      const broadCastedMentorsId = get(menteeSessionsData, 'broadCastedMentors', []).map((mentor) => get(mentor, 'id'));
      if (!broadCastedMentorsId.includes(mentorProfileId)) {
        reason = 'notBroadcastedMentor';
      }
      if (!moment().isBefore(startTime)) {
        reason = 'late';
      }
      const mentorMenteeSessionData = await fetchMentorMenteeSessionForMenteeSession(menteeSessionId);
      if (mentorMenteeSessionData && mentorMenteeSessionData.length > 0) {
        reason = 'alreadyAssigned';
      }
    }
  }
  if (reason) acceptRequestInput.reason = reason;
  addAcceptedSlotRequestByMentorLogData(mentorProfileId, mentorAvailabilitySlotId, acceptRequestInput);
  if (reason === 'notBroadcastedMentor') {
    throw new NotBroadcastedMentor();
  } else if (reason === 'late') {
    throw new LateToAcceptRequest();
  } else if (reason === 'alreadyOpened') {
    throw new SlotAlreadyOpened();
  } else if (reason === 'alreadyFilled') {
    throw new SlotAlreadyFilled();
  } else if (reason === 'alreadyAssigned') {
    throw new SessionAlreadyAssigned();
  }
};

export default addAcceptedSlotRequestByMentorLogCheck;
