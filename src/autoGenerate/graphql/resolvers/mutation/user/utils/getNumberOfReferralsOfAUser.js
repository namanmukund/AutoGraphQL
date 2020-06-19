import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const getNumberOfReferralsOfAUser = async (userId) => {
  const query = `
      query{
        userInvitesMeta(filter:{
          invitedBy_some:{
            id:"${userId}"
          }
        }){
          count
        }
      }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.userInvitesMeta.count');
};

export default getNumberOfReferralsOfAUser;
