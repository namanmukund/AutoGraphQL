import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const updateAUserInvite = async (id, context, variables) => {
  const query = `
    mutation($input: UserInviteUpdate){
      updateUserInvite(id:"${id}", input:$input){
        id
      }
    }
  `;
  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.updateUserInvite.id');
};

export default updateAUserInvite;
