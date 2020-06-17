import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const addUserCredit = async (credits, userConnectId) => {
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
  return get(res, 'data.addUserCredit.id');
};


export default addUserCredit;
