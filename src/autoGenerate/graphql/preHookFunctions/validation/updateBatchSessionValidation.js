import { get } from 'lodash';
import validateBatchSessionInput from './utils/validateBatchSessionInput';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import batchSessionQuery from '../../graphqlQueries/batchSessionQuery';
import { CanNotChangeSessionStatusError } from '../../../../../constants/errors/input';

const updateBatchSessionValidation = async (params) => {
  const { id: batchSessionId, input: { sessionStatus } } = params;
  const batchSessionData = await callLocalGraphqlApi(batchSessionQuery(batchSessionId));
  const batchSession = get(batchSessionData, 'data.batchSession');
  if (!batchSession || !batchSession.id) {
    throw new DatabaseRecordNotFoundError();
  }

  // validate input
  await validateBatchSessionInput(params);

  const { sessionStatus: prevSessionStatus } = batchSession;
  // if session is complete and user is trying to change the status then throw error
  if (prevSessionStatus === 'completed' && sessionStatus && sessionStatus !== 'completed') {
    throw new CanNotChangeSessionStatusError();
  }
  return true;
};

export default updateBatchSessionValidation;
