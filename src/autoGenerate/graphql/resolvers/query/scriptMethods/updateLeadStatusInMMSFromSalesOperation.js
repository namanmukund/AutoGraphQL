import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import updateMentorMenteeSession from './utils/updateMentorMenteeSession';

const getMentorMenteeSalesOperation = async () => {
  const query = `
query{
  salesOperations{
    id
    leadStatus
    firstMentorMenteeSession{
      id
    }
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.salesOperations');
};

const updateLeadStatusInMMSFromSalesOperation = async () => {
  const mentorMenteeSalesOperations = await getMentorMenteeSalesOperation();
  // eslint-disable-next-line no-restricted-syntax
  for (const mentorMenteeSalesOperation of mentorMenteeSalesOperations) {
    const mentorMenteeSessionId = get(mentorMenteeSalesOperation, 'firstMentorMenteeSession.id');
    const leadStatus = get(mentorMenteeSalesOperation, 'leadStatus');
    if (leadStatus && mentorMenteeSessionId) {
      // eslint-disable-next-line no-await-in-loop
      await updateMentorMenteeSession(mentorMenteeSessionId, { leadStatus });
    }
  }
};

export default updateLeadStatusInMMSFromSalesOperation;
