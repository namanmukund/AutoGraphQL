import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

const updatePostSalesAudit = async (postSalesAuditId, input) => {
  const query = `
    mutation($input: PostSalesAuditUpdate) {
        updatePostSalesAudit(id: "${postSalesAuditId}", input: $input) {
            id
            status
        }
    }`;
  const variables = {
    input,
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updatePostSalesAudit');
};

const updatePostSalesAuditPostHookMethod = async (input, _mutationName, _context, params) => {
  const { auditorConnectId } = params;
  /**
   * Check if prev status is not started and auditorConnectId not provided then update status to started
   * i.e To avoid changing status to started when the query for assigning the Auditor is fired.
   * */
  if (get(input, 'status', false) !== 'started' && !auditorConnectId) {
    const updatePostSalesAuditPostHookMethodData = await updatePostSalesAudit(get(input, 'id'), { status: 'started' });
    if (updatePostSalesAuditPostHookMethodData && updatePostSalesAuditPostHookMethodData.id) {
      Object.assign(input, {
        status: updatePostSalesAuditPostHookMethodData.status,
      });
    }
  }
};

export default updatePostSalesAuditPostHookMethod;
