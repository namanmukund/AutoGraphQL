import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const getAParticularUserInvite = async (invitedById, acceptedById) => {
  const query = `
      query{
        userInvites(filter:{
          and:[
            {invitedBy_some:{id:"${invitedById}"}}
            {acceptedBy_some:{id:"${acceptedById}"}}
          ]
        }){
          id
        }
      }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.userInvites[0].id');
};

export default getAParticularUserInvite;
