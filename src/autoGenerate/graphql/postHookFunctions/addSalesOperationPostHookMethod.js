import { ADMIN, UMS_ADMIN, UMS_VIEWER } from '../../../../constants/roles';
import getReferredByUserIdByAcceptedUserId from '../resolvers/mutation/user/utils/getReferredByUserIdByAcceptedUserId';
import getNumberOfReferralsOfAUser from '../resolvers/mutation/user/utils/getNumberOfReferralsOfAUser';
import { MAX_ALLOWED_REFERRALS } from '../../../../constants';
import addUserCredit from '../resolvers/mutation/user/utils/addUserCredit';
import referralCredits from '../../../../constants/referralCredits';
import { log } from '../../../../utils';

const allowedRoles = [ADMIN, UMS_ADMIN, UMS_VIEWER];
const addSalesOperationPostHookMethod = async (input, params, mutationName, context) => {
  const { userVerificationStatus } = input;
  const { clientConnectId } = params;
  // this is the role of sales person or admin
  const { currentUser: { role } } = context;
  if ((userVerificationStatus && userVerificationStatus === 'verified') && allowedRoles.includes(role)) {
    const referredByUserId = await getReferredByUserIdByAcceptedUserId(clientConnectId);
    if (referredByUserId) {
      const numberOfReferralsOfAUser = await getNumberOfReferralsOfAUser(referredByUserId);
      if (numberOfReferralsOfAUser <= MAX_ALLOWED_REFERRALS) {
        // add credits
        await addUserCredit(referralCredits.registrationVerified, referredByUserId);
      } else {
        log(`Max referral limit exceeded by userId ${referredByUserId}`);
      }
    }
  }
};

export default addSalesOperationPostHookMethod;
