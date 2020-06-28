import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const updateUser = async (userId, variables) => {
  const query = `
      mutation($input:UserUpdate){
        updateUser(id: "${userId}", input:$input){
          id
        }
      }
  `;
  const res = await callLocalGraphqlApi(query, {}, variables);
  return get(res, 'data.updateUser.id');
};

export default updateUser;
