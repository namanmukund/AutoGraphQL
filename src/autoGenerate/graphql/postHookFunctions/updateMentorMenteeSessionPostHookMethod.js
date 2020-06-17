import { MENTEE } from '../../../../constants/roles';
import getReferredByUserIdByAcceptedUserId from '../resolvers/mutation/user/utils/getReferredByUserIdByAcceptedUserId';
import getNumberOfReferralsOfAUser from '../resolvers/mutation/user/utils/getNumberOfReferralsOfAUser';
import { MAX_ALLOWED_REFERRALS } from '../../../../constants';
import referralCredits from '../../../../constants/referralCredits';
import { log } from '../../../../utils';
import updateUserCreditsCount from '../resolvers/mutation/user/utils/updateUserCreditsCount';
import getAParticularUserInvite from '../resolvers/mutation/user/utils/getAParticularUserInvite';
import updateAUserInvite from '../resolvers/mutation/user/utils/updateAUserInvite';

// check for previous status
const allowedRoles = [MENTEE];
const updateMentorMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  const { currentUser: { id, role } } = context;
  if (allowedRoles.includes(role)) {
    const referredByUserId = await getReferredByUserIdByAcceptedUserId(id);
    if (referredByUserId) {
      const numberOfReferralsOfAUser = await getNumberOfReferralsOfAUser(referredByUserId);
      if (numberOfReferralsOfAUser <= MAX_ALLOWED_REFERRALS) {
        // add credits
        const userCreditDoc = await updateUserCreditsCount(referralCredits.trialTaken, referredByUserId, 'inc');
        if (userCreditDoc && userCreditDoc.nModified === 1) {
          // update user invite trialTaken status & date
          const userInviteId = await getAParticularUserInvite(referredByUserId, id);
          if (userInviteId) {
            const variables = {
              input: {
                trialTaken: true,
                trialTakenDate: new Date().toISOString(),
              },
            };
            await updateAUserInvite(userInviteId, context, variables);
          }
        }
      } else {
        log(`Max referral limit exceeded by userId ${referredByUserId}`);
      }
    }
  }
};
export default updateMentorMenteeSessionPostHookMethod;
