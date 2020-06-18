import { MutationController } from '../../../../controllers';

const updateUserCreditsCount = (credits, referredByUserId, type) => {
  const newAuthentication = {
    bypass: true,
  };
  const updateObj = {};
  const query = {
    'user.typeId': referredByUserId,
  };
  switch (type) {
    case 'inc': {
      updateObj.$inc = {
        credits,
      };
      break;
    } case 'dec': {
      updateObj.$inc = {
        credits: -credits,
      };
      break;
    }
    default: {
      return null;
    }
  }
  const modelMutation = new MutationController('UserCredit', newAuthentication);
  return modelMutation.update(query, updateObj);
};

export default updateUserCreditsCount;
