import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

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

export default fetchUserApprovedCodeTag;
