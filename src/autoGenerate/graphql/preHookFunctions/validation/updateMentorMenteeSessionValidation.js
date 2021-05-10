import { get } from 'lodash';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import { CanNotChangeSessionStatusError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

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
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorMenteeSession');
};

const updateMentorMenteeSessionValidation = async (newParams, mutationOrQueryName, context) => {
  const { id, input: { sessionStatus } } = newParams;

  const mentorMenteeSessionDoc = await getMentorMenteeSessionData(id);

  if (!(mentorMenteeSessionDoc && mentorMenteeSessionDoc.id)) {
    throw new DatabaseRecordNotFoundError();
  }
  const { sessionStatus: prevSessionStatus } = mentorMenteeSessionDoc;
  // if session is complete and user is trying to change the status then throw error
  if (prevSessionStatus === 'completed' && sessionStatus && sessionStatus !== 'completed') {
    throw new CanNotChangeSessionStatusError();
  }
  // eslint-disable-next-line no-param-reassign
  context.previousDocument = mentorMenteeSessionDoc;
};

export default updateMentorMenteeSessionValidation;
