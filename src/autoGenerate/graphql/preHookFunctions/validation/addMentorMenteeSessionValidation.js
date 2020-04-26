import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import getSelectedSlots from './utils/getSelectedSlots';
import validateMentorMenteePermission from './utils/validateMentorMenteePermission';

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
    topic{
      id
    }
    ${getSlotTimesInString()}
  }
}`;

const validateMenteeStartSessionData = (menteeSession) => {
  const { bookingDate, ...slots } = menteeSession;

  const slotTimeArray = getSelectedSlots(slots);
  const date = new Date(bookingDate);
  const sessionStartDate = date.setHours(date.getHours() + slotTimeArray[0]);
  const sessionEndDate = date.setHours(date.getHours() + 1);
  const currentDate = new Date();

  if (!(currentDate >= sessionStartDate && currentDate < sessionEndDate)) {
    throw new Error('The time is not right');
  }
  throw new Error('sto here');
};
// prehook logic to check if added MentorSession(user id and availabilityDate) already exists
const addMentorMenteeSessionValidation = async (params, mutationOrQueryName, context) => {
  /* check if user has permission to hit API according to his role, if user is mentee and there is
  no mentor token, he should not be able to hit API
   */
  validateMentorMenteePermission(
    context,
  );
  const { menteeSessionConnectId, mentorSessionConnectId } = params;
  if (!menteeSessionConnectId || !mentorSessionConnectId) {
    throw new Error('connectid required');
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
    throw new Error('Sessions already created');
  }
  // validate date and time of starting the session
  const menteeSessionData = await callLocalGraphqlApi(
    menteeSessionQuery(menteeSessionConnectId),
  );
  const menteeSession = get(menteeSessionData, 'data.menteeSession');
  if (!mentorMenteeSessions || !menteeSession.id) {
    throw new Error('Mentee session does not exist');
  }
  validateMenteeStartSessionData(menteeSession);
  return true;
};

export default addMentorMenteeSessionValidation;
