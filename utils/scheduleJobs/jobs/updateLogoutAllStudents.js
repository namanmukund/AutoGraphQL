import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../../src/api';
import pubsub from '../../../src/pubsub';

// const updateBatchSessionQuery = (batchSessionId) => ;

const updateLogoutAllStudents = async ({ batchSessionId, context = {} }, deleteJob = () => {}) => {
  const newContext = context;
  if (!get(newContext, 'pubsub')) {
    Object.assign(newContext, {
      pubsub,
    });
  }

  await callLocalGraphqlApi(`mutation {
    updateBatchSession(
      id: "${batchSessionId}"
      input: { logoutAllStudents: false }
    ) {
      id
    }
  }
  `, context);
  deleteJob();
};

export default updateLogoutAllStudents;
