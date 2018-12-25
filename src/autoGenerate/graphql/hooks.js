import { isArray } from 'lodash';
import { functions, ifAuthorized } from '../../../utils';


import {
  validateLogin, validateExistingUserInput,
  preUserDataValidation,
  validateAppTokenInput,
  isFileDeleteAllowed,
  getUserData,
  validateForgotPassword,
  addUserValidation,
} from './validation';
import {
  UserAlreadyExistsError,
  UnauthorizedOperationError,
  BlockedOperationError,
  UserPasswordNotSetError,
  DatabaseRecordNotFoundError,
  UserPasswordAlreadySetError,
  AlreadyActiveUser,
  EitherPhoneOrEmailOtpRequiredError,
  FileUsageCountNotZeroError,
}
  from '../../../constants/errors';
import { BYPASS } from '../../../constants';

import { createStaticAppToken } from '../../auth';
import deleteFromS3 from '../../middlewares/utils/deleteFromS3';
import { callAddUpdateHookValidationFunction } from './preHookFunctions/validation/utils';

const { hookFunctions } = functions || {};

const hook = (data, mutationName, hookName) => {
  if (!data) {
    return data;
  }
  let newData = data;
  const arrayName = `${mutationName}${hookName}`;
  if (hookFunctions && isArray(hookFunctions[arrayName])) {
    const loopArray = hookFunctions[arrayName];
    loopArray.map((fn) => {
      newData = fn(newData);

      return null;
    });
  }
  return newData;
};

// use context to pass data b/w functions
// validationObject, record, hookValidationsCalled, fetchedData

// This hook is used to transform input argument for a mutation.
// params contain all the arguments whatever you are passing in mutation query
const prehook = async (input, mutationOrQueryName, context, params) => {
  switch (mutationOrQueryName) {
    case 'addUser' : {
      // validate username, phone, email and name and returns email or phone verified accordingly
      const verifiedData = await addUserValidation(input);
      Object.assign(input, verifiedData);
      return preUserDataValidation(input, mutationOrQueryName).then((userData) => {
        if (userData) {
          throw new UserAlreadyExistsError();
        }
        return hook(input, mutationOrQueryName, 'PreHook');
      });
    }
    case 'setUserPassword' : {
      return preUserDataValidation(input, mutationOrQueryName).then((userData) => {
        if (!userData) {
          throw new DatabaseRecordNotFoundError();
        }

        // Only user with active and inactive status are allowed to set their password
        const { status, isSetPassword } = userData;
        switch (status) {
          case 'blocked':
            throw new BlockedOperationError();
          default:
        }

        if (isSetPassword) {
          throw new UserPasswordAlreadySetError();
        }
        return hook(input, mutationOrQueryName, 'PreHook');
      });
    }
    case 'resetUserPassword' : {
      return preUserDataValidation(input, mutationOrQueryName).then((userData) => {
        if (!userData) {
          throw new DatabaseRecordNotFoundError();
        }
        const { status, isSetPassword } = userData;

        // Only user with active and inactive status are allowed to reset their password
        switch (status) {
          case 'blocked':
            throw new BlockedOperationError();
          default:
        }

        if (!isSetPassword) {
          throw new UserPasswordNotSetError();
        }
        Object.assign(input, {
          password: userData.password,
        });
        return hook(input, mutationOrQueryName, 'PreHook');
      });
    }
    case 'tcirtSdrowssaPtes': {
      return preUserDataValidation(input, mutationOrQueryName).then((userData) => {
        if (!userData) {
          throw new DatabaseRecordNotFoundError();
        }
        const { status } = userData;

        // Only user with active and inactive status are allowed to set/reset their password
        switch (status) {
          case 'blocked':
            throw new BlockedOperationError();
          default:
        }

        return hook(input, mutationOrQueryName, 'PreHook');
      });
    }
    case 'signupExistingUser' : {
      return new Promise((resolve) => {
        const verifiedData = validateExistingUserInput(input);
        Object.assign(input, verifiedData);
        resolve(hook(input, mutationOrQueryName, 'PreHook'));
      });
    }
    case 'login' : {
      // validates email or phone number
      const verifiedData = validateLogin(input);
      Object.assign(input, verifiedData);

      return hook(input, mutationOrQueryName, 'PreHook');
    }
    case 'updateUser' : {
      await callAddUpdateHookValidationFunction(mutationOrQueryName, params, context);
      break;
    }

    case 'validateUserOTP' :
    {
      const { phoneOtp, emailOtp } = input;
      if (!phoneOtp && !emailOtp) {
        throw new EitherPhoneOrEmailOtpRequiredError();
      }
      const { decodedUser } = context;
      const { status, id } = decodedUser;
      switch (status) {
        case 'active': {
          return getUserData(id).then((res) => {
            if (!res) {
              throw new DatabaseRecordNotFoundError();
            }
            const { emailVerified, phoneVerified } = res;

            /* Active only when either email or phone is verified for
            validateUserOtp
            */
            if ((phoneOtp && phoneVerified) || (emailOtp && emailVerified)) {
              throw new AlreadyActiveUser();
            }
            return hook(input, mutationOrQueryName, 'PreHook');
          });
        }
        case 'blocked':
          throw new UnauthorizedOperationError();
        case 'inactive': {
          Object.assign(input, { status: BYPASS });
          return hook(input, mutationOrQueryName, 'PreHook');
        }
        default:
      }
      break;
    }
    case 'resendUserOTP': {
      const { decodedUser } = context;
      const { status } = decodedUser;
      switch (status) {
        case 'active':
          throw new AlreadyActiveUser();
        case 'blocked':
          throw new UnauthorizedOperationError();
        case 'inactive': {
          Object.assign(input, { status: BYPASS });
          return hook(input, mutationOrQueryName, 'PreHook');
        }
        default:
      }
      break;
    }
    /* eslint-enable no-fallthrough */
    case 'finishForgotPassword':
    case 'validateForgotPasswordOTP':
    case 'resendForgotPasswordOTP':
    case 'sendForgotPasswordOTP': {
      const newInput = validateForgotPassword(input);
      return hook(newInput, mutationOrQueryName, 'PreHook');
    }
    case 'addAppToken': {
      const { decodedUser } = context;
      const authentication = ifAuthorized(context);

      const { name, type } = input;
      if (decodedUser) {
        const { status } = decodedUser;
        if (status && status !== 'active') {
          throw new UnauthorizedOperationError();
        }
      }

      return validateAppTokenInput(input, authentication).then(() => {
        Object.assign(input, {
          token: createStaticAppToken(name, type),
        });
        return hook(input, mutationOrQueryName, 'PreHook');
      });
    }
    case 'deleteFile' : {
      return isFileDeleteAllowed(params).then((res) => {
        if (!res) {
          throw new FileUsageCountNotZeroError();
        }
        return hook(input, mutationOrQueryName, 'PreHook');
      });
    }
    default : {
      /* If context is not present then it means user is not authenticated and the
      user won't be able to make any db query
      */
      /* Queries are without input but they are not calling prehook function */
      if (input) {
        const { decodedUser } = context;
        // Backend apps won't be having any decoded user
        if (decodedUser) {
          const { status } = decodedUser;
          // for rest of the operations user status need to be inctive state
          if (status && status !== 'active') {
            throw new UnauthorizedOperationError();
          }
        }
      }
    }
  }
  return hook(input, mutationOrQueryName, 'PreHook');
};

// This hook is used to transform output data for a mutation.
/*
Params: input,mutationName,context,params
 */
const posthook = async (input, mutationName) => {
  switch (mutationName) {
    case 'deleteFile' : {
      const { uri } = input;
      await deleteFromS3(uri);
      break;
    }
    case 'deleteFiles' : {
      const urisToDelete = input.map(record => record.uri);
      /* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
      "BinaryExpression[operator='in']"] */
      for (const uri of urisToDelete) {
        /* eslint-disable no-await-in-loop */
        await deleteFromS3(uri);
        /* eslint-enable no-await-in-loop */
      }
      break;
    }
    default :
      break;
  }
  return hook(input, mutationName, 'PostHook');
};

export { prehook, posthook };
