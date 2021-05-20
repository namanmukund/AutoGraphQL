import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const addToUserInviteList = async (invitedByConnectId, acceptedByConnectId) => {
  const query = `
    mutation{
      addUserInvite(input:{
        registrationVerified:false
        trialTaken: false
        coursePurchased: false
      }
        invitedByConnectId:"${invitedByConnectId}"
        acceptedByConnectId:"${acceptedByConnectId}"
      ){
        id
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.addUserInvite.id');
};

export default addToUserInviteList;
