import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError, StudentsLinked } from '../../../../../constants/errors';
import batchQuery from '../../graphqlQueries/batchQuery';

const deleteBatchValidation = async (params) => {
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
  return true;
};

export default deleteBatchValidation;
