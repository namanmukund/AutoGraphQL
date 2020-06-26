import getNumberOfReferralsOfAUser from '../../resolvers/mutation/user/utils/getNumberOfReferralsOfAUser';
import { MAX_ALLOWED_REFERRALS } from '../../../../../constants';
import getUserCreditId from '../../resolvers/mutation/user/utils/getUserCreditId';
import updateUserCreditsCount from '../../resolvers/mutation/user/utils/updateUserCreditsCount';
import referralCredits from '../../../../../constants/referralCredits';
import addUserCredit from '../../resolvers/mutation/user/utils/addUserCredit';
import getAParticularUserInvite from '../../resolvers/mutation/user/utils/getAParticularUserInvite';
import updateAUserInvite from '../../resolvers/mutation/user/utils/updateAUserInvite';
import { log } from '../../../../../utils';
import { REGISTRATION_VERIFIED } from '../../../../../constants/userCreditReason';

const registrationVerificationAddUpdateUserCredit = async (referredByUserId, clientConnectId, context) => {
  const numberOfReferralsOfAUser = await getNumberOfReferralsOfAUser(referredByUserId);
  if (numberOfReferralsOfAUser <= MAX_ALLOWED_REFERRALS) {
    // add credits
    const userCreditId = await getUserCreditId(referredByUserId);
    // update credit if userCreditId exist else add it
    if (userCreditId) {
      await updateUserCreditsCount(referralCredits[1].registrationVerified, referredByUserId, 'inc', REGISTRATION_VERIFIED);
    } else {
      await addUserCredit(referralCredits[1].registrationVerified, referredByUserId, REGISTRATION_VERIFIED);
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
