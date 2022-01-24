/*eslint-disable*/
import QueryController from '../../controllers/QueryController';
import { CanNotChangeVerifiedUserStatusError, CurrentChildIsMentorChild } from '../../../../../constants/errors/input';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import isMentorChild from '../../postHookFunctions/utils/isMentorChild';

const updateSalesOperationValidation = async (params, mutationOrQueryName, context) => {
  const { id, input: { userVerificationStatus, userResponseStatus } } = params;
  const typeName = 'SalesOperation';
  const newAuthentication = {
    bypass: true,
  };
  const modelQueries = new QueryController(typeName, newAuthentication);
  const salesOperationData = await modelQueries.fetchOne({ id });
  const userId = get(salesOperationData, 'client.typeId');
  const isItMentorChild = await isMentorChild(userId);

  if(isItMentorChild) {
    throw new CurrentChildIsMentorChild();
  }

  if (!salesOperationData || (salesOperationData && !salesOperationData.id)) {
    throw new DatabaseRecordNotFoundError();
  }
  // eslint-disable-next-line no-param-reassign
  context.previousDocument = salesOperationData;

  // can not change the status of a verified user
  const { userVerificationStatus: prevUserVerificationStatus } = salesOperationData;
  if (prevUserVerificationStatus === 'verified' && (userVerificationStatus && userVerificationStatus !== 'verified')) {
    throw new CanNotChangeVerifiedUserStatusError();
  }

  if (userResponseStatus) {
    // eslint-disable-next-line no-param-reassign
    params.input.userResponseStatusUpdateDate = new Date().toISOString();
  }
};

export default updateSalesOperationValidation;
