import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

const updatePreSalesAudit = async (preSalesAuditId, input) => {
  const query = `
    mutation($input: PreSalesAuditUpdate) {
        updatePreSalesAudit(id: "${preSalesAuditId}", input: $input) {
            id
            status
        }
    }`;
  const variables = {
    input,
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updatePreSalesAudit');
};

const updatePreSalesAuditPostHookMethod = async (input, _mutationName, _context, params) => {
  const { auditorConnectId } = params;
  /**
   * Check if prev status is not started and auditorConnectId not provided then update status to started
   * i.e To avoid changing status to started when the query for assigning the Auditor is fired.
   * */
  if (get(input, 'status', false) !== 'started' && !auditorConnectId) {
    const updatePreSalesAuditPostHookMethodData = await updatePreSalesAudit(get(input, 'id'), { status: 'started' });
    if (updatePreSalesAuditPostHookMethodData && updatePreSalesAuditPostHookMethodData.id) {
      Object.assign(input, {
        status: updatePreSalesAuditPostHookMethodData.status,
      });
    }
  }
};

export default updatePreSalesAuditPostHookMethod;
