import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const getReferredByUserIdByReferralCode = async (referralCode) => {
  const query = `
    query{
      user(inviteCode:"${referralCode}"){
        id
        role
        secondaryRole
        inviteCode
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.user');
};

export default getReferredByUserIdByReferralCode;
