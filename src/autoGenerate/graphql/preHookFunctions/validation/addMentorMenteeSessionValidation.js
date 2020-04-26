import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import getSelectedSlots from './utils/getSelectedSlots';
import validateMentorMenteePermission from './utils/validateMentorMenteePermission';
import {
  InvalidSessionDateTimeError,
  SessionTopicAndTopicConnectIdMismatchError,
} from '../../../../../constants/errors/input';
import { ConnectIdRequiredError, DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';

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

const validateMenteeStartSessionData = (menteeSession, topicConnectId) => {
  const { bookingDate, topic: { id: topicId }, ...slots } = menteeSession;
  if (topicConnectId !== topicId) {
    throw new SessionTopicAndTopicConnectIdMismatchError();
  }

  const slotTimeArray = getSelectedSlots(slots);
  const date = new Date(bookingDate);
  const sessionStartDate = date.setHours(date.getHours() + slotTimeArray[0]);
  const sessionEndDate = date.setHours(date.getHours() + 1);
  const currentDate = new Date();

  if (!(currentDate >= sessionStartDate && currentDate < sessionEndDate)) {
    throw new InvalidSessionDateTimeError();
  }
  return true;
};
// prehook logic to check if added MentorSession(user id and availabilityDate) already exists
const addMentorMenteeSessionValidation = async (params, mutationOrQueryName, context) => {
  /* check if user has permission to hit API according to his role, if user is mentee and there is
  no mentor token, he should not be able to hit API
   */
  validateMentorMenteePermission(
    context,
  );
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
  validateMenteeStartSessionData(menteeSession, topicConnectId);
  return true;
};

export default addMentorMenteeSessionValidation;
