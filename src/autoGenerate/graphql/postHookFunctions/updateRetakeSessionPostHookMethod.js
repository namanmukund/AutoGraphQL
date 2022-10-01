/* eslint-disable no-console */
import { get } from 'lodash';
import { sessionStatus } from '../../../../constants';
import { callLocalGraphqlApi } from '../../../api';

const deleteBatchScheduleSession = async (retakeSessionId, context) => {
  const deleteQuery = `mutation {
  deleteSchoolSessionOtps(
    filter: { batchSession_some: { retakeSessions_some: { id: "${retakeSessionId}" } } }
  ) {
    id
  }
}
`;
  await callLocalGraphqlApi(deleteQuery, context);
};

const updateRetakeSessionPostHookMethod = async (input, params, mutationName, context) => {
  const retakeSessionId = get(input, 'id');
  const retakeSessionStatusFromInput = get(params, 'input.sessionStatus', 'allotted');
  if (retakeSessionStatusFromInput === sessionStatus.completed) {
    const { prevRetakeSessionStatus } = context;
    if (prevRetakeSessionStatus && prevRetakeSessionStatus !== retakeSessionStatusFromInput) {
      deleteBatchScheduleSession(retakeSessionId, context);
    }
  }
};

export default updateRetakeSessionPostHookMethod;
