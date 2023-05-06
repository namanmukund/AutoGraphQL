/* AutoGenerates resolvers for model types  */
import { camelCase, isArray, get } from 'lodash';
import pluralize from 'pluralize';
import { withFilter } from 'graphql-subscriptions';
import { getParsedASTMap, checkIfArgumentsAreFromSameType, getFieldsBeingFetched } from '../../utils';
import getRelationMutationNames from '../../utils/getRelationMutationNames';
import {
  addMutationResolver, updateMutationResolver,
  deleteMutationResolver, addRelationMutationResolver,
  removeRelationMutationResolver,
  deleteMultipleMutationResolver,
} from './mutation';
import { fetchSingleQueryResolver, fetchListQueryResolver, fetchListAggregationQueryResolver } from './query';
import injectSubscriptionWithCommonAsyncIterator from './utils/injectSubscriptionWithCommonAsyncIterator';
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
import schoolLiveClassLoginViaOtp from './mutation/methods/schoolLiveClassLoginViaOtp';
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
import sendCommsMessage from './query/methods/sendCommsMessages';
import getTotalAmountCollected from './query/methods/getTotalAmountCollected';
import addUpdateBulkSchoolUserData from './mutation/methods/addUpdateBulkSchoolUserData';
import verifyBulkSchoolUserLogin from './mutation/methods/verifyBulkSchoolUserLogin';
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
import shiftBatchSessionsAfterGivenDate from './mutation/methods/shiftBatchSessionsAfterGivenDate';
import sendCertificateInMail from './mutation/methods/sendCertificateInMail';
import sendJourneySnapshotInMail from './mutation/methods/sendJourneySnapshotInMail';
import generateCertificate from './mutation/methods/generateCertificate';
import generateCertificateInBulk from './mutation/methods/generateCertificateInBulk';
import getMagicLink from './query/methods/getMagicLink';
import validateMagicLink from './mutation/methods/validateMagicLink';
import resetPasswordAndLogin from './mutation/methods/resetPasswordAndLogin';
import getEventSpeaker from './query/methods/getEventSpeaker';
import generateMentorChild from './mutation/methods/generateMentorChild';
import getEventWinner from './query/methods/getEventWinner';
import classroomSessions from './query/methods/classroomSessions';
import updateEventSessionAttendance from './mutation/methods/updateEventSessionAttendance';
import getNextOrPrevClassroomSessions from './query/methods/getNextOrPrevClassroomSessions';
import getClassroomDetails from './query/methods/getClassroomDetails';
import scheduleSessions from './mutation/methods/scheduleSessions';
import getSchoolAndBatchDetail from './query/methods/getSchoolAndBatchDetail';
import menteeCourseHomework from './mutation/methods/menteeCourseHomework';
import advanceBatchCurrentSession from './mutation/methods/advanceBatchCurrentSession';
import getBatchDetails from './query/methods/getBatchDetails';
import getBatchStudent from './query/methods/getBatchStudent';
import getSessionComponentMeta from './query/methods/getSessionComponentMeta';
import getClassroomReport from './query/methods/getClassroomReport';
import getPracticeQuestionReport from './query/methods/getPracticeQuestionReport';
import getBuddyStatus from './query/methods/getBuddyStatus';
import generateBatchSessionOtp from './mutation/methods/generateBatchSessionOtp';
import updateSchoolStudentEmail from './mutation/methods/updateSchoolStudentEmail';
import removeBatchStudents from './mutation/methods/removeBatchStudents';
import redisUtils from './query/redisUtils';
import gsuiteUtils from './query/gsuiteUtils';
import getSubmittedAssignmentsStudents from './query/methods/getSubmittedAssignmentsStudents';
import syncUserSessionReports from '../../../../utils/scheduleJobs/jobs/batchAndUpdateUserSessionReports';
import APM from '../../../APM';
import removeBatchesFromStudent from './mutation/userData/removeBatchesFromStudent';
import { CacheController } from '../controllers';

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

const setAPMTransactionNameAndTag = (transactionName, tagKindValue) => {
  APM.setTransactionNameAndTags({
    operationName: transactionName,
    tags: [
      {
        label: 'kind',
        value: tagKindValue,
      },
    ],
  });
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
  setAPMTransactionNameAndTag(mutationName, graphQlOperations.mutation);
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
    const dbData = await posthook(newResult, mutationName, context, params, info);
    // allow subscription on defined events
    // purge cache on defined typeName
    const cacheController = new CacheController({ bypass: true });
    cacheController.clearStellateEdgeCache({
      typeName,
      inputParams,
      mutationResolverName,
    });
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
        subscribe: withFilter(
          (root, params, context) => {
            const { pubsub } = context;
            return pubsub.asyncIterator([modelSingular]);
          },
          async (payload, variables, context) => {
            const { typeId } = payload;
            const { filter: subscriptionFilter } = variables;
            // Return result only if updated payload exists for the the supplied filter.
            if (subscriptionFilter && Object.keys(subscriptionFilter).length) {
              const query = `query ${typeName}($subscriptionFilter: ${typeName}Filter){
                ${modelPlural}(filter: $subscriptionFilter){
                  id
                }
              }`;
              const result = await callLocalGraphqlApi(query, context, {
                subscriptionFilter: {
                  and: [
                    subscriptionFilter,
                    {
                      id: typeId,
                    },
                  ],
                },
              });
              const finalResult = get(result, `data.${modelPlural}`, []);
              return Boolean(finalResult && finalResult.length);
            }
            // Always return result if no filter is sent.
            return true;
          },
        ),
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
            const result = await callLocalGraphqlApi(query, context);
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
        // Setting the transaction name and tags for APM
        setAPMTransactionNameAndTag(modelSingular, graphQlOperations.query);
        await prehook('', modelSingular, context, params);
        return fetchSingleQueryResolver(
          root,
          params,
          typeName,
          info,
          parsedASTMap,
          authentication,
          false,
          context,
        ).then(async (result) => {
          const newResult = toObject(result);
          const postHookResult = await posthook(newResult, modelSingular, context, params, info);
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
        setAPMTransactionNameAndTag(modelPlural, graphQlOperations.query);
        await prehook('', modelSingular, context, params);
        return fetchListQueryResolver(
          root,
          params,
          typeName,
          info,
          parsedASTMap,
          authentication,
          context,
        ).then(async (result) => {
          const newResult = toObject(result);
          const postHookResult = await posthook(newResult, modelSingular, context, params, info);
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
        setAPMTransactionNameAndTag(modelMeta, graphQlOperations.query);
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
          const mutationName = mutationNames.updateMultipleMutation;
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
          setAPMTransactionNameAndTag(addRelationMutationName, graphQlOperations.mutation);
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
            return posthook(newResult, addRelationMutationName, context, params, info);
          });
        },
        [removeRelationMutationName]: async (root, params, context, info) => {
          const authentication = ifAuthorized(context);
          Object.assign(authentication, {
            mutationOrQueryName: removeRelationMutationName,
            mutationOrQuery: graphQlOperations.mutation,
          });
          setAPMTransactionNameAndTag(removeRelationMutationName, graphQlOperations.mutation);
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

            return posthook(newResult, removeRelationMutationName, context, params, info);
          });
        },
      };
      return null;
    });
  }
});

const customMutations = {
  signUp,
  signUpAffiliate,
  signUpSchool,
  signupExistingUser,
  login,
  socialLogin,
  resendUserOTP,
  setUserPassword,
  resetUserPassword,
  sendForgotPasswordOTP,
  resendForgotPasswordOTP,
  validateForgotPasswordOTP,
  finishForgotPassword,
  // Backend token strict password set mutation
  tcirtSdrowssaPtes,
  uploadFile,
  // Resolver for a custom homepage data for user
  userCourseSyllabus,
  // Resolver for a custom homepage data for mentee
  menteeCourseSyllabus,
  // Resolver for a custom journey page for user
  userTopicJourney,
  // Resolver for custom quiz reports for user
  userFirstAndLatestQuizReport,
  userFirstAndLatestQuizReports: userFirstAndLatestQuizReport,
  // Resolver for custom skip video by user
  skipVideo,
  // Resolver for custom skip practice question by user
  skipPracticeQuestion,
  // Resolver for a custom badges implementation for user
  userBadge,
  // Resolver for a custom user badge getting unlocked at topic component level
  getUnlockedUserBadge,
  // Resolver for a custom get user quiz report, when user submits quiz
  getQuizReport,
  // Resolver for sending link on mail in case user forgets password
  sendForgotPasswordLink,
  // Resolver for resetting user password through forgot password link
  resetPasswordFromForgotPasswordLink,
  parentChildSignUp,
  updateParentChildDetail,
  loginViaPassword,
  loginViaOtp,
  signupOrLoginViaOtp,
  schoolLiveClassLoginViaOtp,
  validateUserOTP,
  // Resolver for a custom get user payment information, when user buys a product
  getPaymentRequest,
  // Resolver to check whether hash returned by payU is correct and there is no man in middle attack
  getPaymentResponse,
  addUpdateBulkSchoolUserData,
  verifyBulkSchoolUserLogin,
  updateVisitorReactionOnUserApprovedCode,
  addBulkMentorSession,
  bookB2B2CSlots,
  rebookMenteeSession,
  sendCertificateInMail,
  shiftBatchSessionsAfterGivenDate,
  sendJourneySnapshotInMail,
  generateCertificate,
  generateCertificateInBulk,
  validateMagicLink,
  resetPasswordAndLogin,
  generateMentorChild,
  updateEventSessionAttendance,
  scheduleSessions,
  // Resolver to retrieve homework status based on filters
  menteeCourseHomework,
  // Resolver to retrieve homework status based on filters
  advanceBatchCurrentSession,
  // Resolver to generate batchSession Otp
  generateBatchSessionOtp,
  // Resolver to Update School Student Emails
  updateSchoolStudentEmail,
  // Resolver to remove batchstudets and students from batch
  removeBatchStudents,
  removeBatchesFromStudent,
};

// eslint-disable-next-line no-restricted-syntax
for (const mutationName of Object.keys(customMutations)) {
  if (customMutations[mutationName]) {
    resolvers.Mutation = {
      ...resolvers.Mutation,
      [mutationName]: async (root, params, context, info) => {
        setAPMTransactionNameAndTag(mutationName, graphQlOperations.mutation);
        return customMutations[mutationName](root, params, context, info);
      },
    };
  }
}

// queries
const customQueries = {
  me,
  getPythonByteCode,
  salesOperationReport,
  temporaryScript,
  sendTransactionalMessage,
  sendTextMessage,
  sendCommsMessage,
  // Resolver to get total sell amount and amount colected
  getTotalAmountCollected,
  // Resolver to get the cheatsheets
  getCheatSheet,
  // Resolver to get User's Course Completion Certificate
  getCourseCertificate,
  // Resolver to get Event's Certificate
  getEventCertificate,
  // Resolver to get students Status
  getStudentCurrentStatus,
  // Resolver to get the campaign slots
  getCampaignSlots,
  // Resolver to get school Details
  getSchoolDetails,
  // Resolver to get user's courses
  getUserCourses,
  // Resolver to get school campaign slots
  getSchoolCampaignSlots,
  // Resolver to get magic link
  getMagicLink,
  // Resolver to get event Speaker
  getEventSpeaker,
  // Resolver to get event winner
  getEventWinner,
  // Resolver to get classroom sessions
  classroomSessions,
  // Resolver to get next or prev classroom sessions
  getNextOrPrevClassroomSessions,
  // Resolver to get classroom sessions
  getClassroomDetails,
  // Resolver to get classroom sessions
  getSchoolAndBatchDetail,
  // Resolver to fetch Batch Details from OTP and School Code
  getBatchDetails,
  // Resolver to fetch Batch Details from OTP and School Code
  getBatchStudent,
  // Resolver to get classroom session Details
  getSessionComponentMeta,
  // Resolver to get classroom homework report
  getClassroomReport,
  // Resolver to get classroom homework report
  getPracticeQuestionReport,
  // Resolver to check for the loggedIn status of buddies in buddy login flow
  getBuddyStatus,
  // Resolver to get completed practice or coding assignments
  getSubmittedAssignmentsStudents,
  // Redis utility queries
  cacheKeys: redisUtils.cacheKeys,
  purgeCache: redisUtils.purgeCache,
  getCache: redisUtils.getCache,
  // GSuite utility queries
  createGsuiteFileOrFolder: gsuiteUtils.createGsuiteFileOrFolder,
  updatePermissionOfGsuiteFileOrFolder: gsuiteUtils.updatePermissionOfGsuiteFileOrFolder,
  updateParentFolderOfGsuiteFileOrFolder: gsuiteUtils.updateParentFolderOfGsuiteFileOrFolder,
  duplicateGsuiteFileOrFolder: gsuiteUtils.duplicateGsuiteFileOrFolder,
  deleteGsuiteFileOrFolder: gsuiteUtils.deleteGsuiteFileOrFolder,
  gettingGsuiteChildFileOrFolder: gsuiteUtils.gettingGsuiteChildFileOrFolder,
  getGsuiteFileOrFolderDetails: gsuiteUtils.getGsuiteFileOrFolderDetails,
  createGsuiteLastRevisionFile: gsuiteUtils.createGsuiteLastRevisionFile,
  syncUserSessionReports,
};

// eslint-disable-next-line no-restricted-syntax
for (const queryName of Object.keys(customQueries)) {
  if (customQueries[queryName]) {
    resolvers.Query = {
      ...resolvers.Query,
      [queryName]: (async (root, params, context, info) => {
        setAPMTransactionNameAndTag(queryName, graphQlOperations.query);
        return customQueries[queryName](root, params, context, info);
      }),
    };
  }
}

// Resolver for a custom scalar type 'Date'
resolvers.Date = scalarDate;

// subscriptions
resolvers.Subscription.userUpdated = injectSubscriptionWithCommonAsyncIterator(['USER_UPDATED']);

export default resolvers;
