import getReferredByUserIdByAcceptedUserId from '../../resolvers/mutation/user/utils/getReferredByUserIdByAcceptedUserId';
import getNumberOfReferralsOfAUser from '../../resolvers/mutation/user/utils/getNumberOfReferralsOfAUser';
import { MAX_ALLOWED_REFERRALS } from '../../../../../constants';
import updateUserCreditsCount from '../../resolvers/mutation/user/utils/updateUserCreditsCount';
import getAParticularUserInvite from '../../resolvers/mutation/user/utils/getAParticularUserInvite';
import updateAUserInvite from '../../resolvers/mutation/user/utils/updateAUserInvite';
import { log } from '../../../../../utils';
import { AFFILIATE, MENTEE } from '../../../../../constants/roles';
import { COURSE_PURCHASED } from '../../../../../constants/userCreditReason';

const updateReferrerCreditsPostSessionOrUserPayment = async (
  inviteAcceptedByUserId,
  referralCreditsType,
  context,
  variables,
  userCreditReason,
) => {
  const referredByUserData = await getReferredByUserIdByAcceptedUserId(inviteAcceptedByUserId);

  if (referredByUserData) {
    const { id: referredByUserId, role, secondaryRole } = referredByUserData;
    /*
    --In case of mentee there is a limit of referrals
    --In case of affiliate it's not
     */
    if (role === MENTEE) {
      const numberOfReferralsOfAUser = await getNumberOfReferralsOfAUser(referredByUserId);
      if (numberOfReferralsOfAUser <= MAX_ALLOWED_REFERRALS) {
        // add credits
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
    } else if ((role === AFFILIATE || secondaryRole === AFFILIATE) && userCreditReason === COURSE_PURCHASED) {
      // add credits
      const userCreditDoc = await updateUserCreditsCount(3000, referredByUserId, 'inc', userCreditReason);
      if (userCreditDoc && userCreditDoc.nModified === 1) {
        // update user invite trialTaken status & date
        const userInviteId = await getAParticularUserInvite(referredByUserId, inviteAcceptedByUserId);
        if (userInviteId) {
          await updateAUserInvite(userInviteId, context, variables);
        }
      }
    }
  }
  return null;
};

export default updateReferrerCreditsPostSessionOrUserPayment;
