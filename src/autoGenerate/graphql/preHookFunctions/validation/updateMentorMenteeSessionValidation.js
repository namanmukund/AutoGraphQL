import { get } from 'lodash';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import { CanNotChangeSessionStatusError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';

const getMentorMenteeSessionData = async (id) => {
  const query = `
    query{
      mentorMenteeSession(id:"${id}"){
        id
        isAudit
        sessionStatus
        topic{
          id
          order
        }
        menteeSession{
          id
          bookingDate
          ${getSlotTimesInString()}
        }
        mentorSession {
          id
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorMenteeSession');
};

// query to get mentor from mentorSessionConnectId
const fetchMentor = (id) => `
query{
  mentorSession(id: "${id}"){
    id
    user{
      id
    }
  }
}`;

const updateMentorMenteeSessionValidation = async (newParams, mutationOrQueryName, context) => {
  const {
    id, menteeSessionConnectId, mentorSessionConnectId, input: { sessionStatus, bookingDate },
  } = newParams;

  // check if mentor already has another session in same slot
  const fetchMentorRes = await callLocalGraphqlApi(fetchMentor(mentorSessionConnectId));
  const mentorUserId = get(fetchMentorRes, 'data.mentorSession.user.id', '');
  if (mentorUserId && bookingDate) {
    const getMentorSessionsRes = await callLocalGraphqlApi(
      getMentorSessions(
        mentorUserId,
        bookingDate,
      ),
    );
    const mentorSessions = get(getMentorSessionsRes, 'data.mentorSessions');
    checkIfSlotCanBeOpenedValidation(params, mentorSessions);
  }

  const mentorMenteeSessionDoc = await getMentorMenteeSessionData(id);

  if (!(mentorMenteeSessionDoc && mentorMenteeSessionDoc.id)) {
    throw new DatabaseRecordNotFoundError();
  }
  const { sessionStatus: prevSessionStatus } = mentorMenteeSessionDoc;
  // if session is complete and user is trying to change the status then throw error
  if (prevSessionStatus === 'completed' && sessionStatus && sessionStatus !== 'completed') {
    throw new CanNotChangeSessionStatusError();
  }

  // getting current user from context to send in logs
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  // eslint-disable-next-line no-param-reassign
  context.previousDocument = mentorMenteeSessionDoc;
  context.menteeSessionConnectId = menteeSessionConnectId;
  context.currentUser = currentUser;
  context.mentorSessionConnectId = mentorSessionConnectId;
  if (menteeSessionConnectId && menteeSessionConnectId !== get(mentorMenteeSessionDoc, 'menteeSession.id')) {
    context.hasMenteeSessionChanged = true;
  }
  if (mentorSessionConnectId && mentorSessionConnectId !== get(mentorMenteeSessionDoc, 'mentorSession.id')) {
    context.hasMentorSessionChanged = true;
  }
};

export default updateMentorMenteeSessionValidation;
