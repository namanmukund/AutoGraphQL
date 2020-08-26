import getReferredByUserIdByAcceptedUserId from '../../resolvers/mutation/user/utils/getReferredByUserIdByAcceptedUserId';
import getNumberOfReferralsOfAUser from '../../resolvers/mutation/user/utils/getNumberOfReferralsOfAUser';
import { AFFILIATE_MAX_ALLOWED_REFERRALS, MAX_ALLOWED_REFERRALS } from '../../../../../constants';
import updateUserCreditsCount from '../../resolvers/mutation/user/utils/updateUserCreditsCount';
import getAParticularUserInvite from '../../resolvers/mutation/user/utils/getAParticularUserInvite';
import updateAUserInvite from '../../resolvers/mutation/user/utils/updateAUserInvite';
import { log } from '../../../../../utils';
import { AFFILIATE, MENTEE } from '../../../../../constants/roles';
import { COURSE_PURCHASED } from '../../../../../constants/userCreditReason';
import affiliateReferralCredits from '../../../../../constants/affiliateReferralCredits';
import getUserCreditId from '../../resolvers/mutation/user/utils/getUserCreditId';
import addUserCredit from '../../resolvers/mutation/user/utils/addUserCredit';

const updateReferrerCreditsPostSessionOrUserPayment = async (
  inviteAcceptedByUserId,
  referralCreditsType,
  context,
  variables,
  userCreditReason,
) => {
  const referredByUserData = await getReferredByUserIdByAcceptedUserId(inviteAcceptedByUserId);

  if (referredByUserData && referredByUserData.id) {
    const { id: referredByUserId, role, secondaryRole } = referredByUserData;
    let referralCreditsAmount = 0;
    let maxAllowedReferrals = 0;
    if (role === MENTEE) {
      referralCreditsAmount = referralCreditsType;
      maxAllowedReferrals = MAX_ALLOWED_REFERRALS;
    } else if ((role === AFFILIATE || secondaryRole === AFFILIATE)) {
      if (userCreditReason === COURSE_PURCHASED) {
        referralCreditsAmount = affiliateReferralCredits[0].coursePurchased;
      }
      maxAllowedReferrals = AFFILIATE_MAX_ALLOWED_REFERRALS;
    }
    /*
    --In case of mentee there is a limit of referrals
    --In case of affiliate it's not
     */
    const numberOfReferralsOfAUser = await getNumberOfReferralsOfAUser(referredByUserId);
    if (numberOfReferralsOfAUser <= maxAllowedReferrals) {
      // add credits
      const userCreditId = await getUserCreditId(referredByUserId);
      // update credit if userCreditId exist else add it
      if (userCreditId) {
        await updateUserCreditsCount(referralCreditsAmount, referredByUserId, 'inc', userCreditReason);
      } else {
        await addUserCredit(referralCreditsAmount, referredByUserId, userCreditReason);
      }

      // update user invite trialTaken status & date
      const userInviteId = await getAParticularUserInvite(referredByUserId, inviteAcceptedByUserId);
      if (userInviteId) {
        await updateAUserInvite(userInviteId, context, variables);
      }
    } else {
      log(`Max referral limit exceeded by userId ${referredByUserId}`);
    }
  }
  return null;
};

export default updateReferrerCreditsPostSessionOrUserPayment;
