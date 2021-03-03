import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

const updateMentorMenteeSessionAudit = async (mentorMenteeSessionAuditId, input) => {
  const query = `
    mutation($input:MentorMenteeSessionAuditUpdate!){
      updateMentorMenteeSessionAudit(
        id:"${mentorMenteeSessionAuditId}",
        input: $input,
      ){
        id
        status
      }
    }`;
  const variables = {
    input,
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateMentorMenteeSessionAudit');
};

const updateMentorMenteeSessionAuditPostHookMethod = async (input) => {
  if (get(input, 'status', false) !== 'started') {
    const updateMentorMenteeSessionAuditData = await updateMentorMenteeSessionAudit(get(input, 'id'), { status: 'started' });
    if (updateMentorMenteeSessionAuditData && updateMentorMenteeSessionAuditData.id) {
      Object.assign(input, {
        status: updateMentorMenteeSessionAuditData.status,
      });
    }
  }
};

export default updateMentorMenteeSessionAuditPostHookMethod;
