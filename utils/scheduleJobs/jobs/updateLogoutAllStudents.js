/* eslint-disable no-console */
import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../../src/api';
import pubsub from '../../../src/pubsub';
import { log } from '../../log';

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
  `, context).catch((e) => console.log(e));
  deleteJob();
};

export default updateLogoutAllStudents;
