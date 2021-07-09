import { MutationController } from '../../../../controllers';
import localSignUpMutationPromise from '../../utils/localSignUpMutationPromise';

const USER_TYPE = 'User';
const addUserData = async (authentication, dataWithId, type = 'add') => {
  const modelMutations = new MutationController(USER_TYPE, authentication);
  let result;
  if (type === 'add') {
    result = await localSignUpMutationPromise(
      dataWithId,
      modelMutations,
    );
  } else if (type === 'update') {
    const { id, ...updateObj } = dataWithId;
    result = await modelMutations.updateDocument(id, updateObj);
  }

  return result;
};

export default addUserData;
