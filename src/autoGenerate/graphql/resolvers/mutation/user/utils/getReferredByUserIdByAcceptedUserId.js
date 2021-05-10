import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const getReferredByUserIdByAcceptedUserId = async (acceptedById) => {
  const query = `
      query{
        userInvites(filter:{
          acceptedBy_some:{
            id:"${acceptedById}"
          }
        }){
          id
          invitedBy{
            id
            name
            role
            secondaryRole
          }
        }
      }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.userInvites[0].invitedBy');
};

export default getReferredByUserIdByAcceptedUserId;
