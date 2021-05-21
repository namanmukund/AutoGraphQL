import { MutationController } from '../../../../controllers';
import localSignUpMutationPromise from '../../utils/localSignUpMutationPromise';

const USER_TYPE = 'User';
const addUserData = async (authentication, dataWithId) => {
  const modelMutations = new MutationController(USER_TYPE, authentication);
  const result = await localSignUpMutationPromise(
    dataWithId,
    modelMutations,
  );
  return result;
};

export default addUserData;
