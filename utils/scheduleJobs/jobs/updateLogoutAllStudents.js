/* eslint-disable no-console */
import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../../src/api';
import pubsub from '../../../src/pubsub';
import { log } from '../../log';

const updateLogoutAllStudents = async ({ batchSessionId, context = {} }, deleteJob = () => {}) => {
  const newContext = context;
  if (!get(newContext, 'pubsub')) {
    Object.assign(newContext, {
      pubsub,
    });
  }
  await callLocalGraphqlApi(`mutation {
    updateBatchSessions(
      input: [{ id: "${batchSessionId}", fields: { logoutAllStudents: false } }]
    ) {
      id
    }
  }
  `, context);
  log('Updating LogoutAllStudents in scheduler=============');
  deleteJob();
};

export default updateLogoutAllStudents;
