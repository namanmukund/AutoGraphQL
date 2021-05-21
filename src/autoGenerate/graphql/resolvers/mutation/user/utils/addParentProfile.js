import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const addParentProfile = async (context, parentId, variables) => {
  const query = `
mutation($input: ParentProfileInput!){
  addParentProfile(userConnectId:"${parentId}", input:$input ){
    id
  }
}
  `;
  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.addParentProfile.id');
};

export default addParentProfile;
