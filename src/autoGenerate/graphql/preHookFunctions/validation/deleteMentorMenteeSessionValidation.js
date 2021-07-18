import { get } from 'lodash';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import { CanNotDeleteCompletedSessionError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const getMentorMenteeSessionData = async (id) => {
  const query = `
    query{
      mentorMenteeSession(id:"${id}"){
        id
        sessionStatus
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorMenteeSession');
};

const deleteMentorMenteeSessionValidation = async (newParams, mutationOrQueryName, context) => {
  const { id, mentorSessionConnectId } = newParams;

  const mentorMenteeSessionDoc = await getMentorMenteeSessionData(id);
  if (!(mentorMenteeSessionDoc && mentorMenteeSessionDoc.id)) {
    throw new DatabaseRecordNotFoundError();
  }
  const { sessionStatus: prevSessionStatus } = mentorMenteeSessionDoc;
  // if session is complete and user is trying to delete, then throw error
  if (prevSessionStatus === 'completed') {
    throw new CanNotDeleteCompletedSessionError();
  }
  // getting current user from context to send in logs
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  // eslint-disable-next-line no-param-reassign
  context.currentUser = currentUser;
  context.mentorSessionConnectId = mentorSessionConnectId;
};

export default deleteMentorMenteeSessionValidation;
