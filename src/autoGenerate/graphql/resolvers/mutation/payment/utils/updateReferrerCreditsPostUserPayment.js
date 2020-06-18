import getReferredByUserIdByAcceptedUserId from '../../user/utils/getReferredByUserIdByAcceptedUserId';
import getNumberOfReferralsOfAUser from '../../user/utils/getNumberOfReferralsOfAUser';
import { MAX_ALLOWED_REFERRALS } from '../../../../../../../constants';
import updateUserCreditsCount from '../../user/utils/updateUserCreditsCount';
import referralCredits from '../../../../../../../constants/referralCredits';
import getAParticularUserInvite from '../../user/utils/getAParticularUserInvite';
import updateAUserInvite from '../../user/utils/updateAUserInvite';
import { log } from '../../../../../../../utils';

const updateReferrerCreditsPostUserPayment = async (inviteAcceptedByUserId, context) => {
  const referredByUserId = await getReferredByUserIdByAcceptedUserId(inviteAcceptedByUserId);
  if (referredByUserId) {
    const numberOfReferralsOfAUser = await getNumberOfReferralsOfAUser(referredByUserId);
    if (numberOfReferralsOfAUser <= MAX_ALLOWED_REFERRALS) {
      // add credits
      const userCreditDoc = await updateUserCreditsCount(referralCredits.coursePurchased, referredByUserId, 'inc');
      if (userCreditDoc && userCreditDoc.nModified === 1) {
        // update user invite trialTaken status & date
        const userInviteId = await getAParticularUserInvite(referredByUserId, inviteAcceptedByUserId);
        if (userInviteId) {
          const variables = {
            input: {
              coursePurchased: true,
              coursePurchasedDate: new Date().toISOString(),
            },
          };
          await updateAUserInvite(userInviteId, context, variables);
        }
      }
    } else {
      log(`Max referral limit exceeded by userId ${referredByUserId}`);
    }
  }
};

export default updateReferrerCreditsPostUserPayment;
