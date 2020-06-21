import { MENTEE } from '../../../../constants/roles';
import updateReferrerCreditsPostSessionOrUserPayment from './utils/updateReferrerCreditsPostSessionOrUserPayment';
import referralCredits from '../../../../constants/referralCredits';

/*
  - check if the user if from referral
  - check if the session is the first session
  - check if the referrer has not reached its limit
  - check if the session status is completed for the first time
 */
const allowedRoles = [MENTEE];
const updateMentorMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  const { currentUser, previousDocument: { sessionStatus: prevSessionStatus, topic } } = context;
  if (currentUser && currentUser.id) {
    if (
      (prevSessionStatus !== 'completed' && (input && input.sessionStatus && input.sessionStatus === 'completed'))
      && allowedRoles.includes(currentUser.role)
      && topic.order === 1
    ) {
      const variables = {
        input: {
          trialTaken: true,
          trialTakenDate: new Date().toISOString(),
        },
      };
      const { trialTaken } = referralCredits;
      await updateReferrerCreditsPostSessionOrUserPayment(currentUser.id, trialTaken, context, variables);
    }
  }
};
export default updateMentorMenteeSessionPostHookMethod;
