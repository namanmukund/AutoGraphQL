import getReferredByUserIdByAcceptedUserId from '../../resolvers/mutation/user/utils/getReferredByUserIdByAcceptedUserId';
import getNumberOfReferralsOfAUser from '../../resolvers/mutation/user/utils/getNumberOfReferralsOfAUser';
import { MAX_ALLOWED_REFERRALS } from '../../../../../constants';
import updateUserCreditsCount from '../../resolvers/mutation/user/utils/updateUserCreditsCount';
import getAParticularUserInvite from '../../resolvers/mutation/user/utils/getAParticularUserInvite';
import updateAUserInvite from '../../resolvers/mutation/user/utils/updateAUserInvite';
import { log } from '../../../../../utils';
import { COURSE_PURCHASED, TRIAL_TAKEN } from '../../../../../constants/userCreditReason';

const updateReferrerCreditsPostSessionOrUserPayment = async (inviteAcceptedByUserId, referralCreditsType, context, variables) => {
  const referredByUserId = await getReferredByUserIdByAcceptedUserId(inviteAcceptedByUserId);
  if (referredByUserId) {
    const numberOfReferralsOfAUser = await getNumberOfReferralsOfAUser(referredByUserId);
    if (numberOfReferralsOfAUser <= MAX_ALLOWED_REFERRALS) {
      // add credits
      let userCreditReason = '';
      switch (referralCreditsType) {
        case TRIAL_TAKEN: {
          userCreditReason = TRIAL_TAKEN;
          break;
        }
        case COURSE_PURCHASED: {
          userCreditReason = COURSE_PURCHASED;
          break;
        }
        default:
      }
      const userCreditDoc = await updateUserCreditsCount(referralCreditsType, referredByUserId, 'inc', userCreditReason);
      if (userCreditDoc && userCreditDoc.nModified === 1) {
        // update user invite trialTaken status & date
        const userInviteId = await getAParticularUserInvite(referredByUserId, inviteAcceptedByUserId);
        if (userInviteId) {
          await updateAUserInvite(userInviteId, context, variables);
        }
      }
    } else {
      log(`Max referral limit exceeded by userId ${referredByUserId}`);
    }
  }
  return null;
};

export default updateReferrerCreditsPostSessionOrUserPayment;
