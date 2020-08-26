import { MutationController } from '../../../../controllers';
import addUserCreditLog from './addUserCreditLog';
import { CREDITED, DEBITED } from '../../../../../../../constants';

const updateUserCreditsCount = (credits, referredByUserId, type, userCreditReason) => {
  if (!(credits > 0)) {
    return null;
  }
  const newAuthentication = {
    bypass: true,
  };
  const updateObj = {};
  let creditType = '';
  const query = {
    'user.typeId': referredByUserId,
  };
  switch (type) {
    case 'inc': {
      updateObj.$inc = {
        credits,
      };
      creditType = CREDITED;
      break;
    } case 'dec': {
      updateObj.$inc = {
        credits: -credits,
      };
      creditType = DEBITED;
      break;
    }
    default: {
      return null;
    }
  }
  const modelMutation = new MutationController('UserCredit', newAuthentication);
  return modelMutation.update(query, updateObj).then(async (res) => {
    if (res) {
      await addUserCreditLog(credits, creditType, referredByUserId, userCreditReason);
    }
    return res;
  });
};

export default updateUserCreditsCount;
