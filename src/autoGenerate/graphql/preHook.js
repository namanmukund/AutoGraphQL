import { get } from 'lodash';
import {
  UnauthorizedOperationError,
} from '../../../constants/errors';
import hook from './hook';
import { addUserValidation } from './validation';
import updateUserValidation from './preHookFunctions/validation/updateUserValidation';

const prehook = async (input, mutationOrQueryName, context, params) => {
  switch (mutationOrQueryName) {
    case 'addUser':
    case 'createUser': {
      const doc = await addUserValidation(input, context);
      return hook({ ...input, ...doc }, mutationOrQueryName, 'PreHook');
    }
    case 'updateUser': {
      const doc = await updateUserValidation(params, input, context);
      return hook({ ...input, ...doc }, mutationOrQueryName, 'PreHook');
    }
    default: {
      if (input) {
        const { currentUser } = context;
        if (currentUser) {
          const { status } = currentUser;
          if (status && status !== 'active') {
            throw new UnauthorizedOperationError();
          }
        }
      }
    }
  }
  return hook(input, mutationOrQueryName, 'PreHook');
};

export { prehook };
