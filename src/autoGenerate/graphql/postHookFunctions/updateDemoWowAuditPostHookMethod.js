import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

const updateDemoWowAudit = async (DemoWowAuditId, input, context) => {
  const query = `
    mutation($input:DemoWowAuditUpdate){
      updateDemoWowAudit(
        id:"${DemoWowAuditId}",
        input: $input,
      ){
        id
        status
      }
    }`;
  const variables = {
    input,
  };
  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.updateDemoWowAudit');
};

const updateDemoWowAuditPostHookMethod = async (input, params, _mutationName, context) => {
  const { auditorConnectId } = params;
  /**
   * Check if prev status is not started and auditorConnectId not provided then update status to started
   * i.e To avoid changing status to started when the query for assigning the Auditor is fired.
   * */
  if (get(params, 'input.status', false) !== 'completed') {
    if (get(input, 'status', false) !== 'started' && !auditorConnectId) {
      const updateDemoWowAuditData = await updateDemoWowAudit(get(input, 'id'), { status: 'started' }, context);
      if (updateDemoWowAuditData && updateDemoWowAuditData.id) {
        Object.assign(input, {
          status: updateDemoWowAuditData.status,
        });
      }
    }
  }
};

export default updateDemoWowAuditPostHookMethod;
