import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  enrollmentTypes,
} from '../../../../../constants';
import {
  DatabaseRecordNotFoundError,
} from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

// mutation to update BatchCurrentComponentStatus
const updateBatchCurrentComponentStatusMutation = (
  id,
  sessionStatus,
  currentTopicConnectQuery,
) => `
  mutation{
    updateBatchCurrentComponentStatus(
      id:"${id}",
      ${currentTopicConnectQuery}
      input: {
        latestSessionStatus: "${sessionStatus}"
      }
    ){
      id
    }
  }
  `;

// menthod starts from here
const updateBatchCurrentComponentStatus = async (batchCurrentComponentId, sessionStatus, nextTopicId) => {
  let currentTopicConnectQuery = '';
  if (nextTopicId) {
    currentTopicConnectQuery = `currentTopicConnectId: "${nextTopicId}"`;
  }
  await callLocalGraphqlApi(updateBatchCurrentComponentStatusMutation(
    batchCurrentComponentId,
    sessionStatus,
    currentTopicConnectQuery,
  ));

  return true;
};

export default updateBatchCurrentComponentStatus;
