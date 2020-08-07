/* AutoGenerates resolvers for model types  */
import { camelCase, isArray, get } from 'lodash';
import pluralize from 'pluralize';
import { getParsedASTMap, checkIfArgumentsAreFromSameType, getFieldsBeingFetched } from '../../utils';
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
  userCourseSyllabusMutationResolver,
  menteeCourseSyllabusMutationResolver,
  userTopicJourneyMutationResolver,
  userFirstAndLatestQuizReportMutationResolver,
  skipVideoMutationResolver,
  skipPracticeQuestionMutationResolver,
  sendForgotPasswordLinkMutationResolver,
  resetPasswordFromForgotPasswordLinkMutationResolver,
  getUnlockedUserBadgeMutationResolver,
  userBadgeMutationResolver,
  getQuizReportMutationResolver,
  parentChildSignUpMutationResolver,
  getPaymentRequestMutationResolver,
  getPaymentResponseMutationResolver,
} from './mutation';
import { fetchSingleQueryResolver, fetchListQueryResolver, fetchListAggregationQueryResolver } from './query';
import {
  types, authenticateUser, ifAuthorized, toObject, isErrorThrown, getRandomNumber,
} from '../../../../utils';
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
import {
  ADD, DELETE, DELETE_MULTIPLE,
  META_QUERY,
  PLURAL,
  SINGULAR,
  UPDATE,
  UPDATE_MULTIPLE,
} from '../../../../constants/graphqlOperations';
import socialLoginMutationResolver from './mutation/user/socialLogin';
import { DELETED } from '../../../../constants/subscriptionEvents';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import convertObjectFieldsToStrings from './utils/convertObjectFieldsToStrings';
import subscribeToEvents from './utils/subscribeToEvents';
import loginViaPasswordMutationResolver from './mutation/user/loginViaPassword';
import loginViaOtpMutationResolver from './mutation/user/loginViaOtp';
import { prehook } from '../preHook';
import { posthook } from '../postHook';
import getByteCode from './utils/getByteCode';

const parsedASTMap = getParsedASTMap(types);

const resolvers = {
  Query: {},
  Mutation: {},
  Subscription: {},
};

const defaultMutationsResolvers = {
  addMutationResolver,
  deleteMutationResolver,
  updateMutationResolver,
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
  isMultiple,
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
    isMultiple,
  ).then(async (result) => {
    let newResult;
    if (isArray(result)) {
      newResult = result.map((record) => toObject(record));
    } else {
      newResult = toObject(result);
    }
    const dbData = await posthook(newResult, mutationName, context, params);
    // allow subscription on defined events
    subscribeToEvents(
      typeName,
      mutationName,
      context,
      dbData,
      parsedASTMap,
    );
    return dbData;
  });
};

Object.keys(parsedASTMap).forEach((type) => {
  const definition = parsedASTMap[type];
  const {
    name, field, directives, allowedOperations,
  } = definition;
  const typeName = name.value;
  const modelSingular = camelCase(typeName);
  const modelPlural = camelCase(pluralize(typeName));
  const modelMeta = `${modelPlural}Meta`;

  // model directives logic
  const isModel = directives && hasDirective(directives, 'model');
  if (isModel) {
    // Subscription query resolver
    const { subscribe } = parsedASTMap[typeName];
    const subscribedEvents = get(subscribe, 'events', []);
    if (subscribedEvents.length) {
      resolvers.Subscription[modelSingular] = {
        subscribe: (root, params, context) => {
          const { pubsub } = context;
          return pubsub.asyncIterator([modelSingular]);
        },
        resolve: async (payload, args, context, info) => {
          const { fieldNodes } = info;
          const fieldsFetched = getFieldsBeingFetched(fieldNodes);
          const { data: requestFields } = fieldsFetched;
          const {
            mutation, typeId, dbData,
          } = payload;

          let hasRelationalField = false;
          const nonRelationalFieldsData = {};
          // if relational fields exist then fetch data from api else manipulate db data
          Object.keys(requestFields)
            .forEach((key) => {
              if (Object.keys(requestFields[key]).length) {
                hasRelationalField = true;
              } else {
                nonRelationalFieldsData[key] = dbData[key];
              }
            });

          if (typeId && mutation !== DELETED) {
            // send db data if there is no relational fields
            if (!hasRelationalField) {
              return {
                mutation,
                data: nonRelationalFieldsData,
              };
            }
            // send api data in case of relational fields
            // let stringFields = '';
            const stringFields = convertObjectFieldsToStrings(requestFields).str;
            const query = `query{
                        ${modelSingular}(id:"${typeId}"){
                          ${stringFields}
                        }
                      }`;
            const result = await callLocalGraphqlApi(query);
            const finalResultWithRelationalFields = get(result, `data.${modelSingular}`);
            // return subscriptionPayload
            return {
              mutation,
              data: toObject(finalResultWithRelationalFields),
            };
          }
          // in case of delete only return db data
          return {
            mutation,
            data: nonRelationalFieldsData,
          };
        },
      };
    }
    // Fetch single query resolver.
    if (
      (allowedOperations && allowedOperations === '*')
      || (allowedOperations && allowedOperations !== '*'
        && allowedOperations.length && allowedOperations.includes(SINGULAR))
    ) {
      resolvers.Query[modelSingular] = (async (root, params, context, info) => {
        // Query Resolvers
        const authentication = ifAuthorized(context);
        Object.assign(authentication, {
          mutationOrQueryName: modelSingular,
        });
        await prehook('', modelSingular, context, params);
        return fetchSingleQueryResolver(
          root,
          params,
          typeName,
          info,
          parsedASTMap,
          authentication,
        ).then(async (result) => {
          const newResult = toObject(result);
          const postHookResult = await posthook(newResult, modelSingular, context, params);
          return postHookResult;
        });
      });
    }

    // Fetch list query resolver.
    if (
      (allowedOperations && allowedOperations === '*')
      || (allowedOperations && allowedOperations !== '*'
        && allowedOperations.length && allowedOperations.includes(PLURAL))
    ) {
      resolvers.Query[modelPlural] = (async (root, params, context, info) => {
        const authentication = ifAuthorized(context);
        Object.assign(authentication, {
          mutationOrQueryName: modelPlural,
        });
        await prehook('', modelSingular, context, params);
        return fetchListQueryResolver(
          root,
          params,
          typeName,
          info,
          parsedASTMap,
          authentication,
        ).then(async (result) => {
          const newResult = toObject(result);
          const postHookResult = await posthook(newResult, modelSingular, context, params);
          return postHookResult;
        });
      });
    }

    // Fetch count query resolver.
    if (
      (allowedOperations && allowedOperations === '*')
      || (allowedOperations && allowedOperations !== '*'
        && allowedOperations.length && allowedOperations.includes(META_QUERY))
    ) {
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
    }

    // Mutation Resolvers
    const mutationNames = getMutationNames(typeName);
    if (
      (allowedOperations && allowedOperations === '*')
      || (allowedOperations && allowedOperations !== '*'
        && allowedOperations.length && allowedOperations.includes(ADD))
    ) {
      resolvers.Mutation = {
        ...resolvers.Mutation,
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
      };
    }

    if (
      (allowedOperations && allowedOperations === '*')
      || (allowedOperations && allowedOperations !== '*'
        && allowedOperations.length && allowedOperations.includes(UPDATE))
    ) {
      resolvers.Mutation = {
        ...resolvers.Mutation,
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
      };
    }

    if (
      (allowedOperations && allowedOperations === '*')
      || (allowedOperations && allowedOperations !== '*'
        && allowedOperations.length && allowedOperations.includes(UPDATE_MULTIPLE))
    ) {
      resolvers.Mutation = {
        ...resolvers.Mutation,
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
            isMultiple,
          );
        },
      };
    }
    if (
      (allowedOperations && allowedOperations === '*')
      || (allowedOperations && allowedOperations !== '*'
        && allowedOperations.length && allowedOperations.includes(DELETE))
    ) {
      resolvers.Mutation = {
        ...resolvers.Mutation,
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
      };
    }

    if (
      (allowedOperations && allowedOperations === '*')
      || (allowedOperations && allowedOperations !== '*'
        && allowedOperations.length && allowedOperations.includes(DELETE_MULTIPLE))
    ) {
      resolvers.Mutation = {
        ...resolvers.Mutation,
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
      };
    }
    // add relation mutations resolvers

    // get all fields with with relation directive
    const { relationFields } = definition;
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
      const typeField = fieldName;
      const isFieldValid = validateFieldToAddForConnectMutationGeneration(fieldName,
        relatedTypeField);
      if (!isFieldValid) {
        return null;
      }

      const relationMutationNames = getRelationMutationNames(relationName);
      const addRelationMutationName = relationMutationNames.addToRelationMutation;
      const removeRelationMutationName = relationMutationNames.removeFromRelationMutation;
      // add Relation resolvers functions to resolver Object
      resolvers.Mutation = {
        ...resolvers.Mutation,
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
            typeField,
            relatedTypeField,
            info,
            parsedASTMap,
            authentication,
          ).then((result) => {
            const newResult = toObject(result);
            Object.assign(newResult, {
              typeName,
              fieldName: typeField,
              connectedTypeName: relatedType,
              connectedFieldName: relatedTypeField,
            });
            return posthook(newResult, addRelationMutationName, context, params);
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
            typeField,
            relatedTypeField,
            info,
            parsedASTMap,
            authentication,
          ).then((result) => {
            const newResult = toObject(result);
            Object.assign(newResult, {
              typeName,
              fieldName: typeField,
              connectedTypeName: relatedType,
              connectedFieldName: relatedTypeField,
            });

            return posthook(newResult, removeRelationMutationName, context, params);
          });
        },
      };
      return null;
    });
  }
});

resolvers.Mutation.signUp = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'signUp';
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
  ).then((result) => toObject(result));
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

resolvers.Mutation.socialLogin = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'socialLogin';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return socialLoginMutationResolver(
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
  ).then((result) => toObject(result));
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
  ).then((result) => toObject(result));
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
  ).then((result) => toObject(result));
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
  ).then((result) => toObject(result));
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
  const { filePayload: { middlewareErrorType } } = context;
  // throw error coming from middleware
  checkMiddlewareErrors(middlewareErrorType);
  // check authentication
  const authentication = ifAuthorized(context);
  return uploadFileResolver(root, params, authentication, context);
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
    case 'inactive':
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

resolvers.Query.getPythonByteCode = (async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!authentication || !authentication.app || !authentication.user) {
    throw new UnauthorizedOperationError();
  }

  const { pythonCode } = params;

  const response = await getByteCode(pythonCode);
  const { byteCode, error } = response;
  if (error) {
    return {
      error,
    };
  }
  return {
    byteCode,
  };
});
// Resolver for a custom homepage data for user
resolvers.Mutation.userCourseSyllabus = async (root, params, context, info) => {
  const typeName = 'UserCurrentTopicComponentStatus';
  const mutationName = 'userCourseSyllabus';

  const hookInput = await prehook(params, mutationName, context, params);

  return userCourseSyllabusMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

// Resolver for a custom homepage data for mentee
resolvers.Mutation.menteeCourseSyllabus = async (root, params, context, info) => {
  const typeName = 'UserCurrentTopicComponentStatus';
  const mutationName = 'menteeCourseSyllabus';

  const hookInput = await prehook(params, mutationName, context, params);

  return menteeCourseSyllabusMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

// Resolver for a custom journey page for user
resolvers.Mutation.userTopicJourney = async (root, params, context, info) => {
  const typeName = 'UserCurrentTopicComponentStatus';
  const mutationName = 'userTopicJourney';

  const hookInput = await prehook(params, mutationName, context, params);

  return userTopicJourneyMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
    params,
  ).then((result) => toObject(result));
};

// Resolver for custom quiz reports for user
resolvers.Mutation.userFirstAndLatestQuizReport = async (root, params, context, info) => {
  const typeName = 'UserCurrentTopicComponentStatus';
  const mutationName = 'userFirstAndLatestQuizReport';

  const hookInput = await prehook(params, mutationName, context, params);

  return userFirstAndLatestQuizReportMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
    params,
  ).then((result) => toObject(result));
};

// Resolver for custom skip video by user
resolvers.Mutation.skipVideo = async (root, params, context, info) => {
  const typeName = 'SkipVideo';
  const mutationName = 'skipVideo';

  const hookInput = await prehook(params, mutationName, context, params);

  return skipVideoMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
    params,
  ).then((result) => toObject(result));
};

// Resolver for custom skip practice question by user
resolvers.Mutation.skipPracticeQuestion = async (root, params, context, info) => {
  const typeName = 'SkipPracticeQuestion';
  const mutationName = 'skipPracticeQuestion';

  const hookInput = await prehook(params, mutationName, context, params);

  return skipPracticeQuestionMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
    params,
  ).then((result) => toObject(result));
};

// Resolver for a custom badges implementation for user
resolvers.Mutation.userBadge = async (root, params, context, info) => {
  const typeName = 'UserCurrentTopicComponentStatus';
  const mutationName = 'userBadge';

  const hookInput = await prehook(params, mutationName, context, params);

  return userBadgeMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

// Resolver for a custom user badge getting unlocked at topic component level
resolvers.Mutation.getUnlockedUserBadge = async (root, params, context, info) => {
  const typeName = 'GetUnlockedUserBadge';
  const mutationName = 'getUnlockedUserBadge';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  return getUnlockedUserBadgeMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

// Resolver for a custom get user quiz report, when user submits quiz
resolvers.Mutation.getQuizReport = async (root, params, context, info) => {
  const typeName = 'GetQuizReport';
  const mutationName = 'getQuizReport';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  return getQuizReportMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

// Resolver for sending link on mail in case user forgets password
resolvers.Mutation.sendForgotPasswordLink = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'sendForgotPasswordLink';

  const hookInput = await prehook(params, mutationName, context, params);

  return sendForgotPasswordLinkMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => toObject(result));
};

// Resolver for resetting user password through forgot password link
resolvers.Mutation.resetPasswordFromForgotPasswordLink = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'resetPasswordFromForgotPasswordLink';

  return resetPasswordFromForgotPasswordLinkMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
    context,
  ).then((result) => toObject(result));
};

resolvers.Mutation.parentChildSignUp = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'parentChildSignUp';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return parentChildSignUpMutationResolver(
    root,
    params,
    context,
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

resolvers.Mutation.loginViaPassword = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'loginViaPassword';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return loginViaPasswordMutationResolver(
    root,
    params,
    context,
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

resolvers.Mutation.loginViaOtp = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'loginViaOtp';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return loginViaOtpMutationResolver(
    root,
    params,
    context,
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
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'validateUserOTP';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return validateUserOTPMutationResolver(
    root,
    params,
    context,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => toObject(result));
});

// Resolver for a custom get user payment information, when user buys a product
resolvers.Mutation.getPaymentRequest = async (root, params, context, info) => {
  const typeName = 'PaymentRequest';
  const mutationName = 'getPaymentRequest';

  return getPaymentRequestMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

// Resolver to check whether hash returned by payU is correct and there is no man in middle attack
resolvers.Mutation.getPaymentResponse = async (root, params, context, info) => {
  const typeName = 'PaymentResponse';
  const mutationName = 'getPaymentResponse';

  return getPaymentResponseMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

// Resolver for a custom scalar type 'Date'
resolvers.Date = scalarDate;

export default resolvers;
