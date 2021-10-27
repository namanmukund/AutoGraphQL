import { get } from 'lodash';
import moment from 'moment';
import validateMentorSessionInput from './utils/validateMentorSessionInput';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import mentorSessionQuery from '../../graphqlQueries/mentorSessionQuery';
import {
  DatabaseRecordNotFoundError, LateToAcceptRequest,
  NotBroadcastedMentor, SlotAlreadyFilled, SlotAlreadyOpened,
  SessionAlreadyAssigned,
} from '../../../../../constants/errors';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import checkIfSlotCanBeOpenedValidation from './utils/checkIfSlotCanBeOpenedValidation';
import checkIfSlotCanBeDeletedValidation from './utils/checkIfSlotCanBeDeletedValidation';
import fetchMentorAvailabilitySlot, { fetchMenteeSessionForDemand, fetchMentorMenteeSessionForMenteeSession, fetchMentorSessionsForSlot } from './utils/mentorAvailabilityQueries/fetchMentorAvailabilitySlot';
import getMentorSessions from '../../../utils/getMentorSessions';

const updateMentorSessionValidation = async (params, mutationOrQueryName, context) => {
  const { id: mentorSessionId } = params;
  const mentorSessionData = await callLocalGraphqlApi(mentorSessionQuery(mentorSessionId));
  const mentorSession = get(mentorSessionData, 'data.mentorSession');
  if (mentorSession && !mentorSession) {
    throw new DatabaseRecordNotFoundError();
  }
  if (get(params, 'input.acceptanceObjects.replace', []).length > 0) {
    const {
      mentorAvailabilitySlotId, slotName, date, requestType, menteeSessionId,
    } = get(params, 'input.acceptanceObjects.replace[0]', {});
    const time = slotName.split('slot')[1];
    const mentorProfileId = get(mentorSession, 'user.mentorProfile.id');
    const mentorId = get(mentorSession, 'user.id');
    const startTime = moment(date).set('hours', time);
    if (requestType === 'supply') {
      const mentorAvailabilitySlot = await fetchMentorAvailabilitySlot(mentorAvailabilitySlotId);
      const broadCastedMentorsId = get(mentorAvailabilitySlot, 'broadCastedMentors', []).map((mentor) => get(mentor, 'id'));
      const dateValue = new Date(new Date(date).setHours(0, 0, 0, 0)).toISOString();
      if (!broadCastedMentorsId.includes(mentorProfileId)) {
        throw new NotBroadcastedMentor();
      }
      if (!moment().isBefore(startTime)) {
        throw new LateToAcceptRequest();
      }
      if (get(mentorAvailabilitySlot, 'count', 0) <= get(mentorAvailabilitySlot, 'mentorSessionsMeta.count', 0)) {
        throw new SlotAlreadyFilled();
      }
      const mentorSessionsOfSlot = await fetchMentorSessionsForSlot({ date: dateValue, mentorId, slotNumber: time });
      if (mentorSessionsOfSlot && mentorSessionsOfSlot.length > 0) {
        throw new SlotAlreadyOpened();
      }
    } else if (requestType === 'demand') {
      if (menteeSessionId) {
        const menteeSessionsData = await fetchMenteeSessionForDemand(menteeSessionId);
        const broadCastedMentorsId = get(menteeSessionsData, 'broadCastedMentors', []).map((mentor) => get(mentor, 'id'));
        if (!broadCastedMentorsId.includes(mentorProfileId)) {
          throw new NotBroadcastedMentor();
        }
        if (!moment().isBefore(startTime)) {
          throw new LateToAcceptRequest();
        }
        const mentorMenteeSessionData = await fetchMentorMenteeSessionForMenteeSession(menteeSessionId);
        if (mentorMenteeSessionData && mentorMenteeSessionData.length > 0) {
          throw new SessionAlreadyAssigned();
        }
      }
    }
  }
  const mentorUserId = get(mentorSession, 'user.id', '');
  const availabilityDate = get(params, 'input.availabilityDate', '');
  const { input } = params;
  // only if input is passed, proceed to validate
  if (input) {
    validateMentorSessionInput(params, mentorSession, context);
  }

  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);

  const {
    appName,
  } = userAndAppInfo;
  context.appName = appName;
  // check for slots that are passed as false and as well as true
  // eslint-disable-next-line no-param-reassign
  context.previousDocument = mentorSession;

  if (mentorUserId && availabilityDate) {
    // get all mentorSessions for the availability date
    const getMentorSessionsRes = await callLocalGraphqlApi(
      getMentorSessions(
        mentorUserId,
        availabilityDate,
      ),
    );
    // if a slot is true from before we do not need to validate that
    const timeSlotsInPrevDoc = getSelectedSlotsTime(mentorSession);
    // there can be a max of 3 mentorSessions for an availability date of type(batch/trial/paid)
    // we will check that slot which is being sent true in not already booked for other type
    const mentorSessions = get(getMentorSessionsRes, 'data.mentorSessions');
    checkIfSlotCanBeOpenedValidation(params, mentorSessions, timeSlotsInPrevDoc);
    // slots that are already consumed can not be deleted(set to false)
    checkIfSlotCanBeDeletedValidation(params, mentorSession);
  }
  return true;
};

export default updateMentorSessionValidation;
