import { get } from 'lodash';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import { CanNotChangeSessionStatusError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const getMentorBatchSessionData = async (id) => {
  const query = `
    query{
      mentorBatchSession(id:"${id}"){
        id
        sessionStatus
        topic{
          id
          order
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorBatchSession');
};

const updateMentorBatchSessionValidation = async (newParams) => {
  const { id, input: { sessionStatus } } = newParams;

  const mentorBatchSessionDoc = await getMentorBatchSessionData(id);

  if (!(mentorBatchSessionDoc && mentorBatchSessionDoc.id)) {
    throw new DatabaseRecordNotFoundError();
  }
  const { sessionStatus: prevSessionStatus } = mentorBatchSessionDoc;
  // if session is complete and user is trying to change the status then throw error
  if (prevSessionStatus === 'completed' && sessionStatus && sessionStatus !== 'completed') {
    throw new CanNotChangeSessionStatusError();
  }
};

export default updateMentorBatchSessionValidation;
