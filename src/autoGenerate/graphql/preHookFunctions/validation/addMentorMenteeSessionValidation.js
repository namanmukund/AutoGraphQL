/* eslint-disable */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import validateMentorMenteePermission from './utils/validateMentorMenteePermission';
import {
  SessionTopicAndTopicConnectIdMismatchError,
} from '../../../../../constants/errors/input';
import { ConnectIdRequiredError, DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';
import updateUserSpecificDetailsInParams from './utils/updateUserSpecificDetailsInParams';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';

// query to get mentor Sessions
const mentorMenteeSessionsQuery = (menteeSessionConnectId, mentorSessionConnectId) => `
query{
  mentorMenteeSessions(filter:{
    and:[
      {menteeSession_some:{id:"${menteeSessionConnectId}"}}
      {mentorSession_some:{id:"${mentorSessionConnectId}"}}
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
    user{
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
  if (!menteeSessionConnectId || !mentorSessionConnectId || !topicConnectId) {
    throw new ConnectIdRequiredError();
  }

  // check if mentor mentee sessions already exist
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
  return true;
};

export default addMentorMenteeSessionValidation;
