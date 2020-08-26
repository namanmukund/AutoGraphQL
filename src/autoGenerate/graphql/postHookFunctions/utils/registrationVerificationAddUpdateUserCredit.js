import getNumberOfReferralsOfAUser from '../../resolvers/mutation/user/utils/getNumberOfReferralsOfAUser';
import { AFFILIATE_MAX_ALLOWED_REFERRALS, MAX_ALLOWED_REFERRALS } from '../../../../../constants';
import getUserCreditId from '../../resolvers/mutation/user/utils/getUserCreditId';
import updateUserCreditsCount from '../../resolvers/mutation/user/utils/updateUserCreditsCount';
import referralCredits from '../../../../../constants/referralCredits';
import addUserCredit from '../../resolvers/mutation/user/utils/addUserCredit';
import getAParticularUserInvite from '../../resolvers/mutation/user/utils/getAParticularUserInvite';
import updateAUserInvite from '../../resolvers/mutation/user/utils/updateAUserInvite';
import { log } from '../../../../../utils';
import { REGISTRATION_VERIFIED_FROM_REFERRAL } from '../../../../../constants/userCreditReason';
import { AFFILIATE, MENTEE } from '../../../../../constants/roles';
import affiliateReferralCredits from '../../../../../constants/affiliateReferralCredits';

const registrationVerificationAddUpdateUserCredit = async (referredByUserData, clientConnectId, context) => {
  const { id: referredByUserId, role, secondaryRole } = referredByUserData;
  let referralCreditsAmount = 0;
  let maxAllowedReferrals = 0;
  if (role === MENTEE) {
    referralCreditsAmount = referralCredits[1].registrationVerified;
    maxAllowedReferrals = MAX_ALLOWED_REFERRALS;
  } else if ((role === AFFILIATE || secondaryRole === AFFILIATE)) {
    referralCreditsAmount = affiliateReferralCredits[0].registrationVerified;
    maxAllowedReferrals = AFFILIATE_MAX_ALLOWED_REFERRALS;
  }

  const numberOfReferralsOfAUser = await getNumberOfReferralsOfAUser(referredByUserId);
  if (numberOfReferralsOfAUser <= maxAllowedReferrals) {
    // add credits
    const userCreditId = await getUserCreditId(referredByUserId);
    // update credit if userCreditId exist else add it
    if (userCreditId) {
      await updateUserCreditsCount(referralCreditsAmount, referredByUserId, 'inc', REGISTRATION_VERIFIED_FROM_REFERRAL);
    } else {
      await addUserCredit(referralCreditsAmount, referredByUserId, REGISTRATION_VERIFIED_FROM_REFERRAL);
    }
    // update user credit
    const userInviteId = await getAParticularUserInvite(referredByUserId, clientConnectId);
    if (userInviteId) {
      const variables = {
        input: {
          registrationVerified: true,
          registrationVerifiedDate: new Date().toISOString(),
        },
      };
      await updateAUserInvite(userInviteId, context, variables);
    }
  } else {
    log(`Max referral limit exceeded by userId ${referredByUserId}`);
  }
};

export default registrationVerificationAddUpdateUserCredit;
