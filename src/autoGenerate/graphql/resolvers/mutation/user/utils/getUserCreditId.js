import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const getUserCreditId = async (userId) => {
  const query = `
    query{
      userCredits(filter:{
        user_some:{id:"${userId}"}
      }){
        id
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.userCredits[0].id');
};

export default getUserCreditId;
