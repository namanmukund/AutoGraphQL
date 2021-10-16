import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteBatchSessionsQuery = async (batchSessionId) => {
  const query = `
mutation {
  deleteBatchSession(id:"${batchSessionId}") {
    id
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  // eslint-disable-next-line no-console
  console.log(`------------------------batchSession with ID: ${get(result, 'data.deleteBatchSession.id')} deleted successfully`);
};

export default deleteBatchSessionsQuery;
