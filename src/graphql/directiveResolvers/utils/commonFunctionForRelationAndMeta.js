// the resolvers for the directives defined in your schema
import pluralize from 'pluralize';
import { camelCase, get } from 'lodash';
import models from '../../../autoGenerate/models';
import { fetchListQueryResolver, fetchSingleQueryResolver } from '../../../autoGenerate/graphql/resolvers/query';
import { getParsedASTMap } from '../../../autoGenerate/utils';
import { historyFieldName } from '../../../../constants';
import { InvalidParamsError } from '../../../../constants/errors';
import { ifAuthorized, types } from '../../../../utils';
import { verifyToken } from '../../../auth';
import { handleUserToken } from '../../../middlewares/authMiddleware';
import fetchListAggregationQueryResolver from '../../../autoGenerate/graphql/resolvers/query/fetchListAggregationQueryResolver';
import addAdditionalRelationFieldsToResponse from './addAdditionalRelationFieldsToResponse';
import { prehook } from '../../../autoGenerate/graphql/preHook';
import { posthook } from '../../../autoGenerate/graphql/postHook';
import parseGraphqlResolveInfo from '../../../../utils/parseGraphqlResolveInfo';

const parsedASTMap = getParsedASTMap(types);

const commonFunctionForRelationAndMeta = async (
  result,
  root,
  params,
  context,
  info,
  isMetaType = false,
) => {
  const parsedInfoMap = parseGraphqlResolveInfo(info);
  const countDoc = {
    count: 0,
  };
  if (isMetaType && (!params || !params.filter)) {
    countDoc.count = get(result, 'length') || 0;
    return countDoc;
  }
  if (params && params.first && params.last) {
    throw new InvalidParamsError();
  }
  // if field is model history then return the result
  if (!result || typeof result !== 'object' || info.fieldName === historyFieldName) {
    if (isMetaType) {
      return countDoc;
    }
    return result;
  }
  // Use fetched token info on output keys
  const authentication = ifAuthorized(context);
  // Check if there is a token in root response
  if (root.token) {
    const decoded = verifyToken(root.token);
    // Fill app info from token to authentication object
    if (decoded.appInfo) {
      authentication.app = decoded.appInfo;
    } else if (!authentication.app) {
      authentication.app = true;
    }
    // Fill user info from token to authentication object
    if (decoded.userInfo) {
      authentication.user = decoded.userInfo;
      try {
        // Try to get user roles if there is user info in token
        const userObj = await handleUserToken(authentication.user.id, authentication.app,
          authentication.user);
        authentication.user = {
          ...authentication.user,
          ...userObj,
        };
      } catch (err) {
        // No user roles for this token. Do nothing.
      }
    } else if (!authentication.user) {
      authentication.user = true;
    }
  }
  /* eslint-disable no-param-reassign */
  // Put info back to context
  context.currentApp = authentication.app;
  context.currentUser = authentication.user;
  /* eslint-enable no-param-reassign */
  // Get new params
  const newParams = { ...params };
  if (newParams.name) {
    delete newParams.name;
  }
  const isArray = Array.isArray(result);
  if (isArray) {
    if (!result.length) {
      if (isMetaType) {
        return countDoc;
      }
      return result;
    }
    // get model name
    // Checking if type and typeId both exists in result and extracting relational type.
    const typeName = (result[0].type && result[0].typeId) ? result[0].type : null;
    if (!typeName) {
      if (isMetaType) {
        return countDoc;
      }
      // If result already exists, call postHook and return updated result
      if (result && result.length && get(result, '0.id')) {
        if (parsedInfoMap && parsedInfoMap.typeName) {
          const postHookResult = await posthook(result, camelCase(parsedInfoMap.typeName), context, params, info);
          return postHookResult;
        }
      }
      return result;
    }
    const allTypeIds = result.map((element) => element.typeId);
    // Fill authentication object - will be useful for permission filtering output keys
    Object.assign(authentication, {
      mutationOrQueryName: camelCase(pluralize(typeName)),
    });
    // Check if there is already a filter or not
    if (newParams.filter) {
      newParams.filter = { AND: [newParams.filter, { id_in: allTypeIds }] };
    } else {
      newParams.filter = { id_in: allTypeIds };
    }
    if (isMetaType) {
      return fetchListAggregationQueryResolver(
        root,
        newParams,
        typeName,
        info,
        parsedASTMap,
        authentication,
      );
    }
    /* In relation newParams will carry the parent id info
        {
      "AND": [
        {
          "and": [
            {"status": "unpublished"},
            {"order_lt": 10}
          ]
        },
        {
          "id_in": [
            "xxxxxxxxxxxxxxxxxx"
          ]
        }
      ]
    }
     */
    const modelSingular = camelCase(typeName);
    await prehook('', modelSingular, context, params);

    return fetchListQueryResolver(
      root,
      newParams,
      typeName,
      info,
      parsedASTMap,
      authentication,
      context,
    ).then(async (res) => {
      const finalRelationValue = addAdditionalRelationFieldsToResponse(result, res);
      const postHookResult = await posthook(finalRelationValue, modelSingular, context, params, info);
      return postHookResult;
    });
  }
  // Checking if type and typeId both exists in result and extracting relational type.
  const typeName = (result.type && result.typeId) ? result.type : null;
  const model = models[typeName];
  const { typeId } = result;

  // if result already exists and model is not defined i.e resulting relation
  // is already resolved so call postHook and return updated result.
  if (result && result.id && !typeId && !model) {
    if (parsedInfoMap && parsedInfoMap.typeName) {
      const postHookResult = await posthook(result, camelCase(parsedInfoMap.typeName), context, params, info);
      return postHookResult;
    }
    return result;
  }

  // if result is null or empty doc,i.e. reference doesnt exist, then return null
  if (!model) {
    return null;
  }
  // Fill authentication object - will be useful for permission filtering output keys
  Object.assign(authentication, {
    mutationOrQueryName: camelCase(typeName),
  });
  // params from mutation/query string is given preference
  if (!newParams.id || newParams.id === typeId) {
    newParams.id = typeId;
  } else {
    return null;
  }
  const modelSingular = camelCase(typeName);
  await prehook('', modelSingular, context, params);

  return fetchSingleQueryResolver(
    root,
    newParams,
    typeName,
    info,
    parsedASTMap,
    authentication,
    true, // Allow multiple
    context,
  ).then(async (res) => {
    const finalRelationValue = addAdditionalRelationFieldsToResponse([result], [res]);
    const postHookResult = await posthook(finalRelationValue[0], modelSingular, context, params, info);
    return postHookResult;
  });
};

export default commonFunctionForRelationAndMeta;
