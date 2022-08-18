import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../../../api';

const getRetakeSession = async (retakeSessionId, context) => {
  const deleteQuery = `{
  retakeSession(id:"${retakeSessionId}"){
    sessionStatus
  }
}
`;
  const res = await callLocalGraphqlApi(deleteQuery, context);
  return get(res, 'data.retakeSession.sessionStatus');
};

const updateRetakeSessionValidation = async (params, input, mutationName, context) => {
  const { id: retakeSessionId } = params;
  if (get(input, 'sessionStatus', 'allotted') === 'completed') {
    const prevRetakeSessionStatus = await getRetakeSession(retakeSessionId, context);
    context.prevRetakeSessionStatus = prevRetakeSessionStatus;
  }
};

export default updateRetakeSessionValidation;
