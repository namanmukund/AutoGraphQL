import { ADMIN, UMS_ADMIN, UMS_VIEWER } from '../../../../constants/roles';
import getReferredByUserIdByAcceptedUserId from '../resolvers/mutation/user/utils/getReferredByUserIdByAcceptedUserId';
import registrationVerificationAddUpdateUserCredit from './utils/registrationVerificationAddUpdateUserCredit';

const allowedRoles = [ADMIN, UMS_ADMIN, UMS_VIEWER];
const updateSalesOperationPostHookMethod = async (input, params, mutationName, context) => {
  const { userVerificationStatus, client: { typeId } } = input;
  // this is the role of sales person or admin
  const { currentUser: { role }, previousDocument: { userVerificationStatus: prevUserVerificationStatus } } = context;
  if (
    userVerificationStatus
    && userVerificationStatus === 'verified'
    && prevUserVerificationStatus !== 'verified'
    && allowedRoles.includes(role)
  ) {
    const referredByUserId = await getReferredByUserIdByAcceptedUserId(typeId);
    if (referredByUserId) {
      await registrationVerificationAddUpdateUserCredit(referredByUserId, typeId, context);
    }
  }
};

export default updateSalesOperationPostHookMethod;
