import getReferredByUserIdByReferralCode from './getReferredByUserIdByReferralCode';
import { AFFILIATE } from '../../../../../../../constants/roles';
import getNumberOfReferralsOfAUser from './getNumberOfReferralsOfAUser';
import { MAX_ALLOWED_REFERRALS } from '../../../../../../../constants';
import { log } from '../../../../../../../utils';

/*
- get referral user id
- check if the referral user has not reached its max limit
- add userInvite collection
- update user referral status
 */

const checkForValidReferralCode = async (referralCode) => {
  if (!referralCode) {
    return false;
  }
  const referredByUserData = await getReferredByUserIdByReferralCode(referralCode);
  if (referredByUserData && referredByUserData.id) {
    /*
        In case of an affiliate there is  no restrictions on the number of referrals
         */
    const { id: referredByUserId, role, secondaryRole } = referredByUserData;
    if (role === AFFILIATE || (secondaryRole && secondaryRole === AFFILIATE)) {
      return referredByUserData;
    }
    const numberOfReferralsOfAUser = await getNumberOfReferralsOfAUser(referredByUserId);
    if (numberOfReferralsOfAUser <= MAX_ALLOWED_REFERRALS) {
      return referredByUserData;
    }
    log(`Max referral limit exceeded by userId ${referredByUserId}`);
  }
  return false;
};

export default checkForValidReferralCode;
