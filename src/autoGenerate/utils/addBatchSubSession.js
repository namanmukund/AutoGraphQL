import { callLocalGraphqlApi } from '../../api';

const addBatchSubSession = async (input, mentorConnectId, batchSessionConnectId, context) => {
  const addQuery = `mutation($input: BatchSubSessionInput!) {
    addBatchSubSession(
        input: $input
        mentorConnectId: "${mentorConnectId}",
        batchSessionConnectId: "${batchSessionConnectId}",
    ) {
        id
    }
    }`;
  const variables = {
    input,
  };
  // eslint-disable-next-line no-unused-vars
  const res = await callLocalGraphqlApi(addQuery, context, variables);
};

export default addBatchSubSession;
