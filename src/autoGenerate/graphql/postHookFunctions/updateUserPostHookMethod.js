import { ADMIN, UMS_ADMIN, UMS_VIEWER } from '../../../../constants/roles';
import getReferredByUserIdByAcceptedUserId from '../resolvers/mutation/user/utils/getReferredByUserIdByAcceptedUserId';
import getNumberOfReferralsOfAUser from '../resolvers/mutation/user/utils/getNumberOfReferralsOfAUser';
import { MAX_ALLOWED_REFERRALS } from '../../../../constants';
import { log } from '../../../../utils';
import addUserCredit from '../resolvers/mutation/user/utils/addUserCredit';
import referralCredits from '../../../../constants/referralCredits';

const allowedRoles = [ADMIN, UMS_ADMIN, UMS_VIEWER];
const updateUserPostHookMethod = async (input, mutationName, context) => {
  const { id, salesTeamStatus, fromReferral } = input;
  const { currentUser: { role }, previousDocument: { salesTeamStatus: prevSalesTeamStatus } } = context;
  /*
  - a user is verified by the sales team and has come from referral
  - initiated by valid roles
  - referrer has not reached its limit
  -if above conditions are true add user credit
   */
  if (
    fromReferral
    && allowedRoles.includes(role)
    && prevSalesTeamStatus !== 'verified'
    && salesTeamStatus === 'verified'
  ) {
    const referredByUserId = await getReferredByUserIdByAcceptedUserId(id);
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

export default updateUserPostHookMethod;
