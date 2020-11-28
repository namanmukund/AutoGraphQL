import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getUserSource = async (userId) => {
  const query = `
query{
  user(id:"${userId}"){
    id
    source
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.user.source');
};

export default getUserSource;
