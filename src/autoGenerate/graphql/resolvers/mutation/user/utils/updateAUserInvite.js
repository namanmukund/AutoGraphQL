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
  console.log(44444, res);
  return get(res, 'data.updateUserInvite.id');
};

export default updateAUserInvite;
