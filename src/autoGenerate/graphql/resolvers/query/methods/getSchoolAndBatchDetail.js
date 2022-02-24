import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';

const getSchoolAndBatch = (schoolId, batchId) => `
{
  batches(filter: { and: [{ id: "${batchId}" }, { school_some: { id: "${schoolId}" } }] }) {
    id
  }
}
`;

// this API will return basic school details
const getSchoolAndBatchDetail = (async (root, params, context) => {
  validateAuthentication(context, 'app');
  context.currentUser = true;
  // getting input from params
  const { schoolId, batchId } = params;
  // this will be sent in output

  if (!schoolId || !batchId) {
    throw new MissingMandatoryInputInRequestError();
  }

  const getBatchAndSchoolRes = await callLocalGraphqlApi(getSchoolAndBatch(schoolId, batchId));
  if (!get(getBatchAndSchoolRes, 'data.batches', []).length) {
    throw new DatabaseRecordNotFoundError();
  }
  return {
    result: true,
  };
});

export default getSchoolAndBatchDetail;
