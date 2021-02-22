import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

const fetchUserApprovedCodeTag = async (userApprovedCodeTagId) => {
  const query = `
        query{
          userApprovedCodeTag(id:"${userApprovedCodeTagId}") {
                id
                codeCount
            }
        }
      `;
  const response = await callLocalGraphqlApi(query);
  return get(response, 'data.userApprovedCodeTag');
};

const updateUserApprovedCodeTag = async (userApprovedCodeTagId, input) => {
  const query = `
        mutation($input: UserApprovedCodeTagUpdate!) {
            updateUserApprovedCodeTag(id:"${userApprovedCodeTagId}",input: $input) {
                id
            }
        }
    `;
  const variables = {
    input,
  };
  const response = await callLocalGraphqlApi(query, '', variables);
  return get(response, 'data.updateUserApprovedCodeTag');
};

const addUserApprovedCodeTagMappingPostHookMethod = async (input) => {
  const { userApprovedCodeTag } = input;
  const { typeId: userApprovedCodeTagId } = userApprovedCodeTag;
  const userApprovedCodeTagData = await fetchUserApprovedCodeTag(userApprovedCodeTagId);
  await updateUserApprovedCodeTag(userApprovedCodeTagId, { codeCount: userApprovedCodeTagData.codeCount + 1 });
  return true;
};

export default addUserApprovedCodeTagMappingPostHookMethod;
