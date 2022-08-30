import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchUserApprovedCodeTag = async (userApprovedCodeTagId, context) => {
  const query = `
        query{
          userApprovedCodeTag(id:"${userApprovedCodeTagId}") {
                id
                codeCount
            }
        }
      `;
  const response = await callLocalGraphqlApi(query, context);
  return get(response, 'data.userApprovedCodeTag');
};

export default fetchUserApprovedCodeTag;
