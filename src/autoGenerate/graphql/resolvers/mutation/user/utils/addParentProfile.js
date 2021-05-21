import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const addParentProfile = async (parentId, variables) => {
  const query = `
mutation($input: ParentProfileInput!){
  addParentProfile(userConnectId:"${parentId}", input:$input ){
    id
  }
}
  `;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.addParentProfile.id');
};

export default addParentProfile;
