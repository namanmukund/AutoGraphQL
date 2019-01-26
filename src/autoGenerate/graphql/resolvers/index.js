/* AutoGenerates resolvers for model types  */
import { camelCase, isArray } from 'lodash';
import pluralize from 'pluralize';
import { getParsedASTMap, checkIfArgumentsAreFromSameType } from '../../utils';
import getRelationMutationNames from '../../utils/getRelationMutationNames';
import {
  addMutationResolver, updateMutationResolver, resendUserOTPResolver,
  deleteMutationResolver, addRelationMutationResolver,
  removeRelationMutationResolver, signupMutationResolver,
  signupExistingUserMutationResolver, setUserPasswordMutationResolver,
  resetUserPasswordMutationResolver, loginMutationResolver, uploadFileResolver,
  validateUserOTPMutationResolver,
  sendForgotPasswordOTPMutationResolver,
  validateForgotPasswordOTPMutationResolver,
  finishForgotPasswordMutationResolver,
  resendForgotPasswordOTPMutationResolver,
  deleteMultipleMutationResolver,
  updateMultipleMutationResolver,
} from './mutation';
import { fetchSingleQueryResolver, fetchListQueryResolver, fetchListAggregationQueryResolver } from './query';
import { types, authenticateUser, ifAuthorized, toObject, isErrorThrown, getRandomNumber } from '../../../../utils';
import { prehook, posthook } from '../hooks';
import {
  BYPASS,
  rangeOTP,
  graphQlOperations,
} from '../../../../constants';
import {
  UnauthorizedOperationError,
} from '../../../../constants/errors';
import { getPhoneOTP, getNumberAndSendSms } from '../../../sms';
import { isBackendApp } from '../validation';
import findFieldWithTheRelation from '../../utils/findFieldWithTheRelation';
import validateFieldToAddForConnectMutationGeneration from '../../utils/validateFieldToAddForConnectMutationGeneration';
import hasDirective from '../../utils/hasDirective';
import getSendResendForgotPasswordOTPInput from '../../utils/getSendResendForgotPasswordOTPInput';
import getMutationNames from '../../utils/getMutationNames';
import checkMiddlewareErrors from './utils/checkMiddlewareErrors';
import scalarDate from './utils/scalarDate';

const parsedASTMap = getParsedASTMap(types);

const resolvers = { Query: {}, Mutation: {} };

const defaultMutationsResolvers = {
  addMutationResolver,
  deleteMutationResolver,
  updateMutationResolver,
  updateMultipleMutationResolver,
  deleteMultipleMutationResolver,
};

// FIX: instead of id and input just take in params object as args
const defaultMutationsResolverWrapper = async (
  root,
  params,
  context,
  typeName,
  info,
  mutationName,
  mutationResolverName,
  isMultiple
) => {
  const authentication = ifAuthorized(context);
  Object.assign(authentication, {
    mutationOrQueryName: mutationName,
  });
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);
  // error in preHook return;
  if (isErrorThrown(hookInput)) {
    return hookInput;
  }

  const inputParams = params;
  if (input) {
    inputParams.input = hookInput;
  }

  return defaultMutationsResolvers[mutationResolverName](
    root,
    inputParams,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
    context,
      isMultiple
  ).then((result) => {
    let newResult;
    if (isArray(result)) {
      newResult = result.map(record => toObject(record));
    } else {
      newResult = toObject(result);
    }

    return posthook(newResult, mutationName, context, params);
  });
};

Object.keys(parsedASTMap).forEach((type) => {
  const definition = parsedASTMap[type];
  const { name, field, directives } = definition;
  const typeName = name.value;
  const modelSingular = camelCase(typeName);
  const modelPlural = camelCase(pluralize(typeName));
  const modelMeta = `${modelPlural}Meta`;

  // model directives logic
  const isModel = directives && hasDirective(directives, 'model');
  if (isModel) {
    // Fetch single query resolver.
    resolvers.Query[modelSingular] = ((root, params, context, info) => {
      // Query Resolvers
      const authentication = ifAuthorized(context);
      Object.assign(authentication, {
        mutationOrQueryName: modelSingular,
      });
      return fetchSingleQueryResolver(
        root,
        params,
        typeName,
        info,
        parsedASTMap,
        authentication,
      );
    });

    // Fetch list query resolver.
    resolvers.Query[modelPlural] = ((root, params, context, info) => {
      const authentication = ifAuthorized(context);
      Object.assign(authentication, {
        mutationOrQueryName: modelPlural,
      });
      return fetchListQueryResolver(
        root,
        params,
        typeName,
        info,
        parsedASTMap,
        authentication,
      );
    });

    // Fetch count query resolver.
    resolvers.Query[modelMeta] = ((root, params, context, info) => {
      const authentication = ifAuthorized(context);
      Object.assign(authentication, {
        mutationOrQueryName: modelMeta,
      });
      return fetchListAggregationQueryResolver(
        root,
        params,
        typeName,
        info,
        parsedASTMap,
        authentication,
      );
    });

    // Mutation Resolvers
    const mutationNames = getMutationNames(typeName);
    resolvers.Mutation = Object.assign({}, resolvers.Mutation, {
      [mutationNames.addMutation]: (root, params, context, info) => {
        const mutationName = mutationNames.addMutation;
        const mutationResolverName = 'addMutationResolver';
        return defaultMutationsResolverWrapper(
          root,
          params,
          context,
          typeName,
          info,
          mutationName,
          mutationResolverName,
        );
      },
      [mutationNames.updateMutation]: (root, params, context, info) => {
        const mutationName = mutationNames.updateMutation;
        const mutationResolverName = 'updateMutationResolver';
        return defaultMutationsResolverWrapper(
          root,
          params,
          context,
          typeName,
          info,
          mutationName,
          mutationResolverName,
        );
      },
      [mutationNames.updateMultipleMutation]: (root, params, context, info) => {
        const mutationName = mutationNames.updateMutation;
        const mutationResolverName = 'updateMutationResolver';
        const isMultiple = true;
        return defaultMutationsResolverWrapper(
          root,
          params,
          context,
          typeName,
          info,
          mutationName,
          mutationResolverName,
            isMultiple
        );
      },
      [mutationNames.deleteMutation]: (root, params, context, info) => {
        const mutationName = mutationNames.deleteMutation;
        const mutationResolverName = 'deleteMutationResolver';
        return defaultMutationsResolverWrapper(
          root,
          params,
          context,
          typeName,
          info,
          mutationName,
          mutationResolverName,
        );
      },
      [mutationNames.deleteMultipleMutation]: (root, params, context, info) => {
        const mutationName = mutationNames.deleteMultipleMutation;
        const mutationResolverName = 'deleteMultipleMutationResolver';
        return defaultMutationsResolverWrapper(
          root,
          params,
          context,
          typeName,
          info,
          mutationName,
          mutationResolverName,
        );
      },
    });
    // add relation mutations resolvers

    // get all fields with with relation directive
    const relationFields = definition.relationFields;
    // append add and remove mutation resolvers for each field
    Object.keys(relationFields).forEach((fieldName) => {
      const relationName = relationFields[fieldName];
      const relatedType = field[fieldName].type.dataType;
      if (relatedType.includes('History')) {
        return null;
      }
      // get related field and validate
      const relatedTypeField = findFieldWithTheRelation(relatedType, relationName,
        parsedASTMap, fieldName);
      const isFieldValid = validateFieldToAddForConnectMutationGeneration(fieldName,
        relatedTypeField);
      if (!isFieldValid) {
        return null;
      }

      const relationMutationNames = getRelationMutationNames(relationName);
      const addRelationMutationName = relationMutationNames.addToRelationMutation;
      const removeRelationMutationName = relationMutationNames.removeFromRelationMutation;
      // add Relation resolvers functions to resolver Object
      resolvers.Mutation = Object.assign({}, resolvers.Mutation,
        {
          [addRelationMutationName]: async (root, params, context, info) => {
            const authentication = ifAuthorized(context);
            Object.assign(authentication, {
              mutationOrQueryName: addRelationMutationName,
            });
            const argumentKeys = Object.keys(params);
            checkIfArgumentsAreFromSameType(argumentKeys, typeName);
            checkIfArgumentsAreFromSameType(argumentKeys, relatedType);
            /* in prehook implementation connect ids are picked from first arg(input) as well as
             * params. Ideally they should just picked from params. Hence sending params
              * in fist arg as well */
            await prehook(params, addRelationMutationName, context, params);
            return addRelationMutationResolver(
              root,
              params,
              typeName,
              relatedType,
              relationName,
              info,
              parsedASTMap,
              authentication,
            ).then((result) => {
              const newResult = toObject(result);

              return posthook(newResult, addRelationMutationName);
            });
          },
          [removeRelationMutationName]: async (root, params, context, info) => {
            const authentication = ifAuthorized(context);
            Object.assign(authentication, {
              mutationOrQueryName: removeRelationMutationName,
              mutationOrQuery: graphQlOperations.mutation,
            });
            const argumentKeys = Object.keys(params);
            checkIfArgumentsAreFromSameType(argumentKeys, typeName);
            checkIfArgumentsAreFromSameType(argumentKeys, relatedType);
            await prehook(params, removeRelationMutationName, context, params);
            return removeRelationMutationResolver(
              root,
              params,
              typeName,
              relatedType,
              relationName,
              info,
              parsedASTMap,
              authentication,
            ).then((result) => {
              const newResult = toObject(result);

              return posthook(newResult, removeRelationMutationName);
            });
          },
        },
      );
      return null;
    });
  }
});

resolvers.Mutation.signUp = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'addUser';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);
  const newParams = params;
  newParams.input = getPhoneOTP(hookInput);

  return signupMutationResolver(
    root,
    newParams,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => {
    const newResult = toObject(result);
    const { name } = newResult;
    getNumberAndSendSms(hookInput, name);

    return posthook(newResult, mutationName);
  });
};

resolvers.Mutation.signupExistingUser = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'signupExistingUser';
  const { input } = params;
  const { email } = input;
  const hookInput = await prehook(input, mutationName, context, params);
  const newParams = params;
  // existing user can signup through either email or phone
  const userOtp = getRandomNumber(rangeOTP.min, rangeOTP.max);
  if (email) {
    hookInput.emailOtp = userOtp;
  } else {
    hookInput.phoneOtp = userOtp;
  }
  newParams.input = hookInput;

  return signupExistingUserMutationResolver(
    root,
    newParams,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then(result => toObject(result));
};

resolvers.Mutation.login = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'login';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return loginMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => {
    const newResult = toObject(result);

    return posthook(newResult, mutationName);
  });
};

resolvers.Mutation.validateUserOTP = (async (root, params, context, info) => {
  const typeName = 'User';
  const authentication = ifAuthorized(context);
  const fields = parsedASTMap[typeName].fields;
  const mutationName = 'validateUserOTP';
  Object.assign(authentication, {
    mutationOrQueryName: mutationName,
  });
  const hookInput = await prehook(params, mutationName, context, params);

  if (hookInput.status && hookInput.status === BYPASS) {
    authentication.user.status = BYPASS;
    delete hookInput.status;
  }

  const newParams = hookInput;
  return validateUserOTPMutationResolver(
    root,
    newParams,
    typeName,
    info,
    fields,
    parsedASTMap,
    authentication,
  ).then(result => toObject(result));
});

resolvers.Mutation.resendUserOTP = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'resendUserOTP';
  Object.assign(authentication, {
    mutationOrQueryName: mutationName,
  });
  const hookInput = await prehook(params, mutationName, context, params);

  if (hookInput.status && hookInput.status === BYPASS) {
    authentication.user.status = BYPASS;
    delete hookInput.status;
  }
  const newParams = getPhoneOTP(hookInput);

  return resendUserOTPResolver(
    root,
    newParams,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => {
    const newResult = toObject(result);
    return posthook(newResult, mutationName);
  });
};

resolvers.Mutation.setUserPassword = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'setUserPassword';

  const hookInput = await prehook(params, mutationName, context, params);
  return setUserPasswordMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  );
};

resolvers.Mutation.resetUserPassword = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'resetUserPassword';

  const hookInput = await prehook(params, mutationName, context, params);

  return resetUserPasswordMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  );
};

resolvers.Mutation.sendForgotPasswordOTP = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'sendForgotPasswordOTP';

  const hookInput = await prehook(params, mutationName, context, params);
  const newParams = getSendResendForgotPasswordOTPInput(hookInput);

  return sendForgotPasswordOTPMutationResolver(
    root,
    newParams,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then(result => toObject(result));
};

resolvers.Mutation.resendForgotPasswordOTP = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'resendForgotPasswordOTP';

  const hookInput = await prehook(params, mutationName, context, params);
  const newParams = getSendResendForgotPasswordOTPInput(hookInput);

  return resendForgotPasswordOTPMutationResolver(
    root,
    newParams,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then(result => toObject(result));
};

resolvers.Mutation.validateForgotPasswordOTP = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'validateForgotPasswordOTP';

  const hookInput = await prehook(params, mutationName, context, params);

  return validateForgotPasswordOTPMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then(result => toObject(result));
};

resolvers.Mutation.finishForgotPassword = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'finishForgotPassword';

  const hookInput = await prehook(params, mutationName, context, params);

  return finishForgotPasswordMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then(result => toObject(result));
};
// Backend token strict password set mutation
resolvers.Mutation.tcirtSdrowssaPtes = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'tcirtSdrowssaPtes';

  // Check strict authorization
  // Allow if backend app.
  if (!authentication || !authentication.app || !isBackendApp(authentication)) {
    throw new UnauthorizedOperationError();
  }

  const hookInput = await prehook(params, mutationName, context, params);
  return setUserPasswordMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  );
};

resolvers.Mutation.uploadFile = (root, params, context) => {
  const { middlewareErrorType, middlewareErrorMessage } = context;
  // throw error coming from middleware
  checkMiddlewareErrors(middlewareErrorType, middlewareErrorMessage);
  // check authentication
  const authentication = ifAuthorized(context);
  return uploadFileResolver(root, params, authentication);
};

// queries
resolvers.Query.me = ((root, params, context, info) => {
  // Query Resolvers
  const authenticatedUser = authenticateUser(context);
  const authentication = ifAuthorized(context);
  if (!authenticatedUser) {
    return null;
  }
  Object.assign(authentication, {
    mutationOrQueryName: 'me',
  });
  const { id } = authenticatedUser;
  const typeName = 'User';
  const queryParam = { id };

  // allow me query for inactive user and block for blocked user
  const { status } = authenticatedUser;
  switch (status) {
    case 'blocked':
      throw new UnauthorizedOperationError();
    case 'inactive' :
      // this will prevent inactive status check for me query
      authentication.user.status = BYPASS;
      break;
    default:
  }

  return fetchSingleQueryResolver(
    root,
    queryParam,
    typeName,
    info,
    parsedASTMap,
    authentication,
  );
});

// Resolver for a custom scalar type 'Date'
resolvers.Date = scalarDate;

export default resolvers;
