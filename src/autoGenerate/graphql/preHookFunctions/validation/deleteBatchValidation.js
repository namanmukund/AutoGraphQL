import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError, StudentsLinked } from '../../../../../constants/errors';
import batchQuery from '../../graphqlQueries/batchQuery';
import getBatchSessionForBatch from '../../graphqlQueries/getBatchSessionsForBatch';

const deleteBatchValidation = async (params, mutationOrQueryName, context) => {
  const { id: batchId } = params;
  const batchData = await callLocalGraphqlApi(batchQuery(batchId));
  const batch = get(batchData, 'data.batch');

  if (!batch || !batch.id) {
    throw new DatabaseRecordNotFoundError();
  }
  // if any user is still present, cannot delete
  const studentsMeta = batch.studentsMeta;
  if (studentsMeta && studentsMeta.count !== 0) {
    throw new StudentsLinked();
  }

  const batchSessions = await callLocalGraphqlApi(getBatchSessionForBatch(batchId));
  context.batchSessions = get(batchSessions, 'data.batchSessions');
  return true;
};

export default deleteBatchValidation;
