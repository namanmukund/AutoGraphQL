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

const updateMentorMenteeSessionAuditPostHookMethod = async (input, _mutationName, _context, params) => {
  const { auditorConnectId } = params;
  /**
   * Check if prev status is not started and auditorConnectId not provided then update status to started
   * i.e To avoid changing status to started when the query for assigning the Auditor is fired.
   * */
  if (get(input, 'status', false) !== 'started' && !auditorConnectId) {
    const updateMentorMenteeSessionAuditData = await updateMentorMenteeSessionAudit(get(input, 'id'), { status: 'started' });
    if (updateMentorMenteeSessionAuditData && updateMentorMenteeSessionAuditData.id) {
      Object.assign(input, {
        status: updateMentorMenteeSessionAuditData.status,
      });
    }
  }
};

export default updateMentorMenteeSessionAuditPostHookMethod;
