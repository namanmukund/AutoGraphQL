import { MENTEE } from '../../../../constants/roles';
import getReferredByUserIdByAcceptedUserId from '../resolvers/mutation/user/utils/getReferredByUserIdByAcceptedUserId';
import updateReferrerCreditsPostSessionOrUserPayment from './utils/updateReferrerCreditsPostSessionOrUserPayment';

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
      const variables = {
        input: {
          trialTaken: true,
          trialTakenDate: new Date().toISOString(),
        },
      };
      await updateReferrerCreditsPostSessionOrUserPayment(referredByUserId, context, variables);
    }
  }
};
export default updateMentorMenteeSessionPostHookMethod;
