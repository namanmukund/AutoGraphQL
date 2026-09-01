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
import APM from '../../../APM';
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

// Resolver for a custom scalar type 'Date'
resolvers.Date = scalarDate;

export default resolvers;
