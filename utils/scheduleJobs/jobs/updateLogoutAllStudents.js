/* eslint-disable no-console */
import { get } from 'lodash';
import { MutationController } from '../../../src/autoGenerate/graphql/controllers';
import pubsub from '../../../src/pubsub';
import { log } from '../../log';

const updateLogoutAllStudents = async ({ batchSessionId, context = {} }, deleteJob = () => {}) => {
  const newContext = context;
  if (!get(newContext, 'pubsub')) {
    Object.assign(newContext, {
      pubsub,
    });
  }
  // Using MongoDB update as in graphql update is causing issue from postHook method;
  const modelMutations = new MutationController('BatchSession', { bypass: true });
  if (modelMutations) modelMutations.update({ id: batchSessionId }, { logoutAllStudents: false });
  log('Updating LogoutAllStudents in scheduler=============');
  deleteJob();
};

export default updateLogoutAllStudents;
