/* eslint-disable */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import validateMentorMenteePermission from './utils/validateMentorMenteePermission';
import {
  SessionTopicAndTopicConnectIdMismatchError,
} from '../../../../../constants/errors/input';
import { ConnectIdRequiredError, DatabaseRecordNotFoundError, MentorIsInactiveError } from '../../../../../constants/errors';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';
import updateUserSpecificDetailsInParams from './utils/updateUserSpecificDetailsInParams';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import getMentorSessions from '../../../utils/getMentorSessions';
import { checkIfSlotCanBeOpenedValidation } from './utils';
import isTrialSession from '../../resolvers/utils/isTrialSession';
import getSelectedSlotsStringArray from '../../postHookFunctions/utils/getSelectedSlotsStringArray';
import { ALLOWED_ROLE_FOR_MANUAL_SESSIONS } from '../../../../../constants';
import { getHoursDiff } from './utils/validateMenteeSessionInput';

// query to get mentor Sessions
const mentorMenteeSessionsQuery = (menteeSessionConnectId, mentorSessionConnectId) => `
query{
  mentorMenteeSessions(filter:{
    and:[
      {menteeSession_some:{id:"${menteeSessionConnectId}"}}
      ${mentorSessionConnectId ? `{mentorSession_some:{id:"${mentorSessionConnectId}"}}` : ''}
    ]   
  }){
    id
  }
}`;

// query to get mentor Sessions
const menteeSessionQuery = (menteeSessionId) => `
query{
  menteeSession(id:"${menteeSessionId}"){
    id
    bookingDate
    startMinutes
    endMinutes
    mentorAvailabilitySlot{
      id
    }
    broadCastedMentors {
      id
    }
    user{
      studentProfile {
        batch {
          code
        }
      }
      id
      source
      country
    }
    topic{
      id
    }
    ${getSlotTimesInString()}
  }
}`;

// query to get mentor from mentorSessionConnectId
const fetchMentor = (id) => `
query{
  mentorSession(id: "${id}"){
    id
    user{
      id
      mentorProfile{
        isMentorActive
      }
    }
  }
}`;

const validateMenteeStartSessionData = (menteeSession, topicConnectId, params) => {
  // eslint-disable-next-line no-unused-vars
  const { bookingDate, topic: { id: topicId }, ...slots } = menteeSession;
  if (topicConnectId !== topicId) {
    throw new SessionTopicAndTopicConnectIdMismatchError();
  }


  // uncomment later on
  const slotTimeArray = getSelectedSlotsTime(slots);
  const date = new Date(bookingDate);
  const sessionStartDate = date.setHours(date.getHours() + slotTimeArray[0]);
  params.input = {...params.input,  sessionStartDate: new Date(sessionStartDate).toISOString()}
  const sessionEndDate = date.setHours(date.getHours() + 1);
  const currentDate = new Date();

  // added to allow testing on staging
  // if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
  //   //   if (!(currentDate >= sessionStartDate && currentDate < sessionEndDate)) {
  //   //     throw new InvalidSessionDateTimeError();
  //   //   }
  //   // }
  return true;
};

// prehook logic to check if added MentorSession(user id and availabilityDate) already exists
const addMentorMenteeSessionValidation = async (params, mutationOrQueryName, context) => {
  /* check if user has permission to hit API according to his role, if user is mentee and there is
  no mentor token, he should not be able to hit API
   */
  // commenting this as now we are removing the login flow of mentor
  // validateMentorMenteePermission(
  //   context,
  // );
  const { menteeSessionConnectId, mentorSessionConnectId, topicConnectId } = params;
  if (!menteeSessionConnectId || !topicConnectId) {
    throw new ConnectIdRequiredError();
  }

  // check if mentor mentee sessions already exist for same mentor
  const mentorMenteeSessionsData = await callLocalGraphqlApi(
    mentorMenteeSessionsQuery(
      menteeSessionConnectId,
      mentorSessionConnectId,
    ),
  );

  const mentorMenteeSessions = get(mentorMenteeSessionsData, 'data.mentorMenteeSessions');
  if (mentorMenteeSessions && mentorMenteeSessions.length) {
    throw new SimilarDocumentAlreadyExistError();
  }
  // validate date and time of starting the session
  const menteeSessionData = await callLocalGraphqlApi(
    menteeSessionQuery(menteeSessionConnectId),
  );
  const menteeSession = get(menteeSessionData, 'data.menteeSession');
  if (!mentorMenteeSessions || !menteeSession.id) {
    throw new DatabaseRecordNotFoundError({
      date: {
        message: 'mentee session does not exist',
      },
    });
  }
  validateMenteeStartSessionData(menteeSession, topicConnectId, params);

  // check if mentor already has another session in same slot
  if (mentorSessionConnectId) {
    const fetchMentorRes = await callLocalGraphqlApi(fetchMentor(mentorSessionConnectId));
    const mentorUserId = get(fetchMentorRes, 'data.mentorSession.user.id', '');
    const { bookingDate } = menteeSession;
    const isMentorActive = get(fetchMentorRes,'data.mentorSession.user.mentorProfile.isMentorActive')
    if(!isMentorActive){
      throw new MentorIsInactiveError()
    }
    if (mentorUserId && bookingDate) {
      const getMentorSessionsRes = await callLocalGraphqlApi(
        getMentorSessions(
          mentorUserId,
          bookingDate,
        ),
      );
      const mentorSessions = get(getMentorSessionsRes, 'data.mentorSessions');
      // constucting data in appropriate format
      const menteeSessionSlots = { input: { ...menteeSession } };
      checkIfSlotCanBeOpenedValidation(menteeSessionSlots, mentorSessions, null, get(menteeSession, 'user.studentProfile.batch.code'));
    }
  }

  //update source & country in mentorMenteeSession
  const userData = get(menteeSession, 'user');
  updateUserSpecificDetailsInParams(userData, params);

  // getting current user from context to send in logs
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;

  context.menteeSession = menteeSession;
  context.mentorSessionConnectId = mentorSessionConnectId;
  context.currentUser = currentUser;
  const isTrial = await isTrialSession(topicConnectId);
  if (typeof isTrial === 'boolean' && isTrial) {
    if (get(menteeSession, 'broadCastedMentors', []).length > 0) {
      const mentorMenteeSessionsData = await callLocalGraphqlApi(
        mentorMenteeSessionsQuery(
          menteeSessionConnectId,
        ),
      );
      if (get(mentorMenteeSessionsData, 'data.mentorMenteeSessions', []).length > 0) {
        throw new SimilarDocumentAlreadyExistError();
      }
      params.input.isBroadCastedSession = true;
    }
    if (get(menteeSession, 'mentorAvailabilitySlot.id'))
      context.mentorAvailabilitySlotId = get(menteeSession, 'mentorAvailabilitySlot.id')
  }
  const userRoleFromContext = currentUser && currentUser.role;
  if (ALLOWED_ROLE_FOR_MANUAL_SESSIONS.includes(userRoleFromContext) && isTrial) {
    const slotTimeStringArray = getSelectedSlotsStringArray(menteeSession);
    if (slotTimeStringArray.length > 0) {
      const timeDiff = getHoursDiff(slotTimeStringArray[0].split('slot')[1], bookingDate);
      if (timeDiff) {
        context.isManualSession = timeDiff;
      }
    }
  }
  return true;
};

export default addMentorMenteeSessionValidation;
