import { callLocalGraphqlApi } from '../../api';

const updateBatchSubSession = async (id, input, context) => {
  const addQuery = `mutation($input: BatchSubSessionUpdate) {
    updateBatchSubSession(
        id: "${id}"
        input: $input
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

export default updateBatchSubSession;
