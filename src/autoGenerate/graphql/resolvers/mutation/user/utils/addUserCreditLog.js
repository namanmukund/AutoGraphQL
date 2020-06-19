import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const addUserCreditLog = async (amount, type, userConnectId) => {
  const query = `
    mutation{
      addUserCreditLog(input:{
        amount: ${amount}
        type: ${type}
      } userConnectId: "${userConnectId}"){
        id
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.addUserCreditLog.id');
};


export default addUserCreditLog;
