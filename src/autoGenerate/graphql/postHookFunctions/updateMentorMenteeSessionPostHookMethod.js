import { MENTEE } from '../../../../constants/roles';
import getReferredByUserIdByAcceptedUserId from '../resolvers/mutation/user/utils/getReferredByUserIdByAcceptedUserId';
import getNumberOfReferralsOfAUser from '../resolvers/mutation/user/utils/getNumberOfReferralsOfAUser';
import { MAX_ALLOWED_REFERRALS } from '../../../../constants';
import referralCredits from '../../../../constants/referralCredits';
import { log } from '../../../../utils';
import updateUserCreditsCount from '../resolvers/mutation/user/utils/updateUserCreditsCount';
import getAParticularUserInvite from '../resolvers/mutation/user/utils/getAParticularUserInvite';
import updateAUserInvite from '../resolvers/mutation/user/utils/updateAUserInvite';

/*
  - check if the user if from referral
  - check if the session is the first session
  - check if the referrer has not reached its limit
  - check if the session status is completed for the first time
 */
const allowedRoles = [MENTEE];
const updateMentorMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  const { currentUser: { id, role }, previousDocument: { sessionStatus: prevSessionStatus, topic } } = context;
  if (
    (prevSessionStatus !== 'completed' && (input && input.sessionStatus === 'completed'))
    && allowedRoles.includes(role)
    && topic.order === 1
  ) {
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
