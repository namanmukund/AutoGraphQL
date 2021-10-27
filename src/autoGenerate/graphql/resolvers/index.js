/* AutoGenerates resolvers for model types  */
import { camelCase, isArray, get } from 'lodash';
import pluralize from 'pluralize';
import { getParsedASTMap, checkIfArgumentsAreFromSameType, getFieldsBeingFetched } from '../../utils';
import getRelationMutationNames from '../../utils/getRelationMutationNames';
import {
  addMutationResolver, updateMutationResolver,
  deleteMutationResolver, addRelationMutationResolver,
  removeRelationMutationResolver,
  deleteMultipleMutationResolver,
} from './mutation';
import { fetchSingleQueryResolver, fetchListQueryResolver, fetchListAggregationQueryResolver } from './query';
import {
  types, ifAuthorized, toObject, isErrorThrown,
} from '../../../../utils';
import {
  graphQlOperations,
} from '../../../../constants';

import findFieldWithTheRelation from '../../utils/findFieldWithTheRelation';
import validateFieldToAddForConnectMutationGeneration from '../../utils/validateFieldToAddForConnectMutationGeneration';
import hasDirective from '../../utils/hasDirective';
import getMutationNames from '../../utils/getMutationNames';
import scalarDate from './utils/scalarDate';
import {
  ADD, DELETE, DELETE_MULTIPLE,
  META_QUERY,
  PLURAL,
  SINGULAR,
  UPDATE,
  UPDATE_MULTIPLE,
} from '../../../../constants/graphqlOperations';
import { DELETED } from '../../../../constants/subscriptionEvents';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import convertObjectFieldsToStrings from './utils/convertObjectFieldsToStrings';
import subscribeToEvents from './utils/subscribeToEvents';
import { prehook } from '../preHook';
import { posthook } from '../postHook';
import parentChildSignUp from './mutation/methods/parentChildSignUp';
import loginViaPassword from './mutation/methods/loginViaPassword';
import validateUserOTP from './mutation/methods/validateUserOTP';
import getPaymentResponse from './mutation/methods/getPaymentResponse';
import resetPasswordFromForgotPasswordLink from './mutation/methods/resetPasswordFromForgotPasswordLink';
import getQuizReport from './mutation/methods/getQuizReport';
import getPaymentRequest from './mutation/methods/getPaymentRequest';
import loginViaOtp from './mutation/methods/loginViaOtp';
import signupOrLoginViaOtp from './mutation/methods/signupOrLoginViaOtp';
import sendForgotPasswordLink from './mutation/methods/sendForgotPasswordLink';
import getUnlockedUserBadge from './mutation/methods/getUnlockedUserBadge';
import userBadge from './mutation/methods/userBadge';
import skipPracticeQuestion from './mutation/methods/skipPracticeQuestion';
import skipVideo from './mutation/methods/skipVideo';
import userFirstAndLatestQuizReport from './mutation/methods/userFirstAndLatestQuizReport';
import userTopicJourney from './mutation/methods/userTopicJourney';
import userCourseSyllabus from './mutation/methods/userCourseSyllabus';
import getPythonByteCode from './query/methods/getPythonByteCode';
import uploadFile from './mutation/methods/uploadFile';
import tcirtSdrowssaPtes from './mutation/methods/tcirtSdrowssaPtes';
import finishForgotPassword from './mutation/methods/finishForgotPassword';
import validateForgotPasswordOTP from './mutation/methods/validateForgotPasswordOTP';
import resendForgotPasswordOTP from './mutation/methods/resendForgotPasswordOTP';
import sendForgotPasswordOTP from './mutation/methods/sendForgotPasswordOTP';
import resetUserPassword from './mutation/methods/resetUserPassword';
import setUserPassword from './mutation/methods/setUserPassword';
import resendUserOTP from './mutation/methods/resendUserOTP';
import socialLogin from './mutation/methods/socialLogin';
import login from './mutation/methods/login';
import signupExistingUser from './mutation/methods/signupExistingUser';
import signUp from './mutation/methods/signUp';
import me from './query/methods/me';
import menteeCourseSyllabus from './mutation/methods/menteeCourseSyllabus';
import signUpAffiliate from './mutation/methods/signUpAffiliate';
import salesOperationReport from './query/methods/salesOperationReport';
import temporaryScript from './query/methods/temporaryScript';
import sendTransactionalMessage from './query/methods/sendTransactionalMessage';
import sendTextMessage from './query/methods/sendTextMessage';
import getTotalAmountCollected from './query/methods/getTotalAmountCollected';
import addUpdateBulkSchoolUserData from './mutation/methods/addUpdateBulkSchoolUserData';
import updateVisitorReactionOnUserApprovedCode from './mutation/methods/updateVisitorReactionOnUserApprovedCode';
import getCheatSheet from './query/methods/getCheatSheet';
import addBulkMentorSession from './mutation/methods/addBulkMentorSession';
import updateParentChildDetail from './mutation/methods/updateParentChildDetail';
import getCampaignSlots from './query/methods/getCampaignSlots';
import getSchoolDetails from './query/methods/getSchoolDetails';
import bookB2B2CSlots from './mutation/methods/bookB2B2CSlots';
import getStudentCurrentStatus from './query/methods/getStudentCurrentStatus';
import getCourseCertificate from './query/methods/getCourseCertificate';
import getEventCertificate from './query/methods/getEventCertificate';
import signUpSchool from './mutation/methods/signUpSchool';
import rebookMenteeSession from './mutation/methods/rebookMenteeSession';
import getSchoolCampaignSlots from './query/methods/getSchoolCampaignSlots';
import getUserCourses from './query/methods/getUserCourses';
import sendCertificateInMail from './mutation/methods/sendCertificateInMail';
import sendJourneySnapshotInMail from './mutation/methods/sendJourneySnapshotInMail';
import generateCertificate from './mutation/methods/generateCertificate';

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
    name, field, directives, allowedOperations, userToken,
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
        const authentication = ifAuthorized(context, userToken);
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
        const authentication = ifAuthorized(context, userToken);
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
        const authentication = ifAuthorized(context, userToken);
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

resolvers.Mutation.signUp = signUp;
resolvers.Mutation.signUpAffiliate = signUpAffiliate;
resolvers.Mutation.signUpSchool = signUpSchool;
resolvers.Mutation.signupExistingUser = signupExistingUser;
resolvers.Mutation.login = login;
resolvers.Mutation.socialLogin = socialLogin;
resolvers.Mutation.resendUserOTP = resendUserOTP;
resolvers.Mutation.setUserPassword = setUserPassword;
resolvers.Mutation.resetUserPassword = resetUserPassword;
resolvers.Mutation.sendForgotPasswordOTP = sendForgotPasswordOTP;
resolvers.Mutation.resendForgotPasswordOTP = resendForgotPasswordOTP;
resolvers.Mutation.validateForgotPasswordOTP = validateForgotPasswordOTP;
resolvers.Mutation.finishForgotPassword = finishForgotPassword;
// Backend token strict password set mutation
resolvers.Mutation.tcirtSdrowssaPtes = tcirtSdrowssaPtes;
resolvers.Mutation.uploadFile = uploadFile;
// Resolver for a custom homepage data for user
resolvers.Mutation.userCourseSyllabus = userCourseSyllabus;
// Resolver for a custom homepage data for mentee
resolvers.Mutation.menteeCourseSyllabus = menteeCourseSyllabus;
// Resolver for a custom journey page for user
resolvers.Mutation.userTopicJourney = userTopicJourney;
// Resolver for custom quiz reports for user
resolvers.Mutation.userFirstAndLatestQuizReport = userFirstAndLatestQuizReport;
// Resolver for custom skip video by user
resolvers.Mutation.skipVideo = skipVideo;
// Resolver for custom skip practice question by user
resolvers.Mutation.skipPracticeQuestion = skipPracticeQuestion;
// Resolver for a custom badges implementation for user
resolvers.Mutation.userBadge = userBadge;
// Resolver for a custom user badge getting unlocked at topic component level
resolvers.Mutation.getUnlockedUserBadge = getUnlockedUserBadge;
// Resolver for a custom get user quiz report, when user submits quiz
resolvers.Mutation.getQuizReport = getQuizReport;
// Resolver for sending link on mail in case user forgets password
resolvers.Mutation.sendForgotPasswordLink = sendForgotPasswordLink;
// Resolver for resetting user password through forgot password link
resolvers.Mutation.resetPasswordFromForgotPasswordLink = resetPasswordFromForgotPasswordLink;
resolvers.Mutation.parentChildSignUp = parentChildSignUp;
resolvers.Mutation.updateParentChildDetail = updateParentChildDetail;
resolvers.Mutation.loginViaPassword = loginViaPassword;
resolvers.Mutation.loginViaOtp = loginViaOtp;
resolvers.Mutation.signupOrLoginViaOtp = signupOrLoginViaOtp;
resolvers.Mutation.validateUserOTP = validateUserOTP;
// Resolver for a custom get user payment information, when user buys a product
resolvers.Mutation.getPaymentRequest = getPaymentRequest;
// Resolver to check whether hash returned by payU is correct and there is no man in middle attack
resolvers.Mutation.getPaymentResponse = getPaymentResponse;
resolvers.Mutation.addUpdateBulkSchoolUserData = addUpdateBulkSchoolUserData;
resolvers.Mutation.updateVisitorReactionOnUserApprovedCode = updateVisitorReactionOnUserApprovedCode;
resolvers.Mutation.addBulkMentorSession = addBulkMentorSession;
resolvers.Mutation.bookB2B2CSlots = bookB2B2CSlots;
resolvers.Mutation.rebookMenteeSession = rebookMenteeSession;
resolvers.Mutation.sendCertificateInMail = sendCertificateInMail;
resolvers.Mutation.sendJourneySnapshotInMail = sendJourneySnapshotInMail;
resolvers.Mutation.generateCertificate = generateCertificate;

// queries
resolvers.Query.me = me;
resolvers.Query.getPythonByteCode = getPythonByteCode;
resolvers.Query.salesOperationReport = salesOperationReport;
resolvers.Query.temporaryScript = temporaryScript;
resolvers.Query.sendTransactionalMessage = sendTransactionalMessage;
resolvers.Query.sendTextMessage = sendTextMessage;
// Resolver to get total sell amount and amount colected
resolvers.Query.getTotalAmountCollected = getTotalAmountCollected;
// Resolver to get the cheatsheets
resolvers.Query.getCheatSheet = getCheatSheet;
// Resolver to get User's Course Completion Certificate
resolvers.Query.getCourseCertificate = getCourseCertificate;
// Resolver to get Event's Certificate
resolvers.Query.getEventCertificate = getEventCertificate;
// Resolver to get students Status
resolvers.Query.getStudentCurrentStatus = getStudentCurrentStatus;
// Resolver to get the campaign slots
resolvers.Query.getCampaignSlots = getCampaignSlots;
// Resolver to get school Details
resolvers.Query.getSchoolDetails = getSchoolDetails;
// Resolver to get user's courses
resolvers.Query.getUserCourses = getUserCourses;
// Resolver to get school campaign slots
resolvers.Query.getSchoolCampaignSlots = getSchoolCampaignSlots;
// Resolver for a custom scalar type 'Date'
resolvers.Date = scalarDate;

export default resolvers;
