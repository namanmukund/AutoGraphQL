import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';
import addUserCreditLog from './addUserCreditLog';
import { CREDITED } from '../../../../../../../constants';

const addUserCredit = async (credits, userConnectId, userCreditReason) => {
  const query = `
    mutation{
      addUserCredit(input:{
        credits: ${credits}
      }, userConnectId: "${userConnectId}"){
        id
        credits
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  // add user credit log
  await addUserCreditLog(credits, CREDITED, userConnectId, userCreditReason);
  return get(res, 'data.addUserCredit.id');
};


export default addUserCredit;
