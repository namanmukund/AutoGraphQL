import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const updateUserPaymentPlanMutation = async (
  id,
  input,
  topicId = null,
) => {
  let connectStr = '';
  if (topicId) {
    connectStr = `lastSessionTopicConnectId:"${topicId}",`;
  }
  const query = `
mutation($input:UserPaymentPlanUpdate){
  updateUserPaymentPlan(
    id:"${id}",
    ${connectStr}
    input:$input
  ){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', { input });
  const data = get(res, 'data.updateUserPaymentPlan');
  return data;
};

export default updateUserPaymentPlanMutation;
