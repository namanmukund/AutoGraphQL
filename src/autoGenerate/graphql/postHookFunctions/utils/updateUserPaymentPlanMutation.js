import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const updateUserPaymentPlanMutation = async (
  id,
  input,
) => {
  const query = `
mutation($input:UserPaymentPlanUpdate){
  updateUserPaymentPlan(
    id:"${id}", 
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
