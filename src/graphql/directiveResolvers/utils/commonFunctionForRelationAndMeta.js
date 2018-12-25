// the resolvers for the directives defined in your schema
import pluralize from 'pluralize';
import { camelCase } from 'lodash';
import models from '../../../autoGenerate/models';
import { fetchListQueryResolver, fetchSingleQueryResolver } from '../../../autoGenerate/graphql/resolvers/query';
import { getParsedASTMap } from '../../../autoGenerate/utils';
import { historyFieldName } from '../../../../constants';
import { InvalidParamsError } from '../../../../constants/errors';
import { ifAuthorized, types } from '../../../../utils';
import { verifyToken } from '../../../auth';
import { handleUserToken } from '../../../middlewares/authMiddleware';
import fetchListAggregationQueryResolver
  from '../../../autoGenerate/graphql/resolvers/query/fetchListAggregationQueryResolver';
import addAdditionalRelationFieldsToResponse from './addAdditionalRelationFieldsToResponse';

const parsedASTMap = getParsedASTMap(types);

const commonFunctionForRelationAndMeta = async (
  result,
  root,
  params,
  context,
  info,
  isMetaType = false,
) => {
  const countDoc = {
    count: 0,
  };
  if (isMetaType && (!params || !params.filter)) {
    countDoc.count = result.length || 0;
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
  context.decodedApp = authentication.app;
  context.decodedUser = authentication.user;
  /* eslint-enable no-param-reassign */
  // Get new params
  const newParams = Object.assign({}, params);
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
    const typeName = result[0].type;
    if (!typeName) {
      if (isMetaType) {
        return countDoc;
      }
      return result;
    }
    const allTypeIds = result.map(element => element.typeId);
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
    return fetchListQueryResolver(
      root,
      newParams,
      typeName,
      info,
      parsedASTMap,
      authentication,
    ).then((res) => {
      const finalRelationValue = addAdditionalRelationFieldsToResponse(result, res);
      return finalRelationValue;
    });
  }
  const typeName = result.type;
  const model = models[typeName];
  const typeId = result.typeId;
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
  return fetchSingleQueryResolver(
    root,
    newParams,
    typeName,
    info,
    parsedASTMap,
    authentication,
    true, // Allow multiple
  ).then((res) => {
    const finalRelationValue = addAdditionalRelationFieldsToResponse([result], [res]);
    return finalRelationValue[0];
  });
};

export default commonFunctionForRelationAndMeta;
