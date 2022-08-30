import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const updateUserApprovedCodeTag = async (userApprovedCodeTagId, input, context) => {
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
  const response = await callLocalGraphqlApi(query, context, variables);
  return get(response, 'data.updateUserApprovedCodeTag');
};

export default updateUserApprovedCodeTag;
