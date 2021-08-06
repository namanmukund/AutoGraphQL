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
        isPostSalesAudit
        topic{
          id
          order
        }
        menteeSession{
          id
          bookingDate
          ${getSlotTimesInString()}
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorMenteeSession');
};

const updateMentorMenteeSessionValidation = async (newParams, mutationOrQueryName, context) => {
  const {
    id, menteeSessionConnectId, mentorSessionConnectId, input: { sessionStatus, isPostSalesAudit: isPostSalesAuditFromInput },
  } = newParams;

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
  context.isPostSalesAuditFromInput = isPostSalesAuditFromInput;
};

export default updateMentorMenteeSessionValidation;
