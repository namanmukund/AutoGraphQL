/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
  "BinaryExpression[operator='in']"] */
import {
  includes, split, without, get,
} from 'lodash';
import { allFilters, historyFieldName, scalarTypes } from '../../../../../constants';
import { InvalidFilterArgumentsError, NotFilterRequiredError } from '../../../../../constants/errors';
import { types } from '../../../../../utils';
import { getParsedASTMap } from '../../../utils';
import models from '../../../models';
import QueryController from './index';

const parsedASTMap = getParsedASTMap(types);

const validateFilterKeysLength = (filterKeys) => {
  let isValid = false;
  if (filterKeys.length <= 1) {
    isValid = true;
  } else {
    isValid = false;
    // restricting to only one filter key in params
  }
  return isValid;
};

// returns filterKey and Value from filter params
const getFilterKeyAndValueFromParam = (filterObject) => {
  const filterKeys = Object.keys(filterObject);
  const isValidKeysLength = validateFilterKeysLength(filterKeys);
  if (!isValidKeysLength) {
    throw new InvalidFilterArgumentsError();
  }
  const filterKey = filterKeys[0];
  const filterValue = filterObject[filterKey];
  const returnObject = { filterKey, filterValue };
  return returnObject;
};

// get all foreign keys from relation filter querying in related collection
const getRelatedTypeIdsFromRelationFilter = (relatedType, fieldName, filterValue) => {
  const relatedModel = models[relatedType];
  const relationParams = { filter: filterValue };
  /* eslint-disable no-use-before-define  */
  // get query for querying in related model
  return getQueryParams(relationParams, relatedType)
  /* eslint-enable no-use-before-define  */
  // get all docs that match relation filter in related type
    .then((query) => relatedModel.find(query).exec())
    // return all type ids
    .then((values) => values.map((value) => value.id));
};

const getQueryParamsForRelationFilterSubSet = async (param, relatedType,
  fieldName, isNoneFilter, isArrayFilter) => {
  let queryParamObject = {};
  const filterObj = getFilterKeyAndValueFromParam(param);
  // check is filter field is an addtnl field
  const filterFieldName = split(filterObj.filterKey, '_')[0];
  const additionalFieldAst = parsedASTMap[relatedType].field[filterFieldName];
  let isFieldAnAdditionalField;
  //  is field model history field
  if (additionalFieldAst && additionalFieldAst.directive
    && additionalFieldAst.directive.isRelationField) {
    isFieldAnAdditionalField = true;
  }
  if (isFieldAnAdditionalField) {
    /* eslint-disable no-use-before-define  */
    const queryValue = await getQueryFromFilter(filterObj.filterKey,
      filterObj.filterValue, relatedType);
    /* eslint-enable no-use-before-define  */
    const queryFilterKey = Object.keys(queryValue)[0];

    if (isNoneFilter) {
      queryParamObject[`${fieldName}.${queryFilterKey}`] = { $ne: queryValue[queryFilterKey] };
    } else {
      queryParamObject[`${fieldName}.${queryFilterKey}`] = queryValue[queryFilterKey];
    }
  } else if (isArrayFilter) {
    // if array filter
    queryParamObject = param;
  } else {
    const allTypeIds = await getRelatedTypeIdsFromRelationFilter(relatedType,
      fieldName, param);
    if (isNoneFilter) {
      queryParamObject[`${fieldName}.typeId`] = { $nin: allTypeIds };
    } else {
      queryParamObject[`${fieldName}.typeId`] = { $in: allTypeIds };
    }
  }
  return { queryParamObject, isFieldAnAdditionalField };
};

// get filter for relation filters with and/or
// params- arrayType : and/or
const getAndOrArrayRelationFilterValue = async (arrayFilterType, filterObject) => {
  const {
    filterValue, relatedType, fieldName, isNoneFilter,
  } = filterObject;
  const queryParams = {};

  queryParams[`$${arrayFilterType}`] = [];
  const relationFiltersArray = [];
  /* eslint-disable no-await-in-loop */
  // loop through the and filters
  for (const param of filterValue) {
    // queryParamObject will be pushed to the queryParams array
    const {
      queryParamObject,
      isFieldAnAdditionalField,
    } = await getQueryParamsForRelationFilterSubSet(param,
      relatedType, fieldName, isNoneFilter, true);
    if (isFieldAnAdditionalField) {
      // append query param object to final query object
      queryParams[`$${arrayFilterType}`].push(queryParamObject);
    } else {
      // make and/or query to fetch related typeIds
      relationFiltersArray.push(queryParamObject);
    }
  }
  /* eslint-enable no-await-in-loop */
  // get all type ids from filters array
  const relationFiltersQueryValue = {};
  relationFiltersQueryValue[`${arrayFilterType}`] = relationFiltersArray;
  const allTypeIds = await getRelatedTypeIdsFromRelationFilter(relatedType,
    fieldName, relationFiltersQueryValue);
  const queryParamObject = {};
  if (isNoneFilter) {
    queryParamObject[`${fieldName}.typeId`] = { $nin: allTypeIds };
  } else {
    queryParamObject[`${fieldName}.typeId`] = { $in: allTypeIds };
  }
  queryParams[`$${arrayFilterType}`].push(queryParamObject);
  return queryParams;
};

// appends 'data' in keys as in history collection, records are present inside data element
const modifyParamForQueryInHistoryCollection = (params, isAndOrQuery) => {
  const queryParams = {};
  const objectKey = Object.keys(params)[0];
  if (!isAndOrQuery) {
    queryParams[`data.${objectKey}`] = params[objectKey];
  } else {
    // if and or or query , append data word in all filter keys
    queryParams[objectKey] = [];
    params[objectKey].forEach((param) => {
      const paramObject = {};
      const paramObjectKey = Object.keys(param)[0];
      paramObject[`data.${paramObjectKey}`] = param[paramObjectKey];
      queryParams[objectKey].push(paramObject);
    });
  }
  return queryParams;
};

// query history collection and find ids of models which match filter
const getModelsFromHistoryCollection = async (params, typeName) => {
  const historyModelName = `${typeName}History`;
  const queryModel = new QueryController(historyModelName, { bypass: true });
  let queryParams = {};
  const { filterKey, filterValue } = getFilterKeyAndValueFromParam(params);
  /* eslint-disable no-use-before-define  */
  if ([allFilters.and, allFilters.AND,
    allFilters.or, allFilters.OR].includes(filterKey)) {
    const lowerCaseFilterKey = filterKey.toLowerCase();
    const queryPromiseArray = filterValue.map((val) => {
      const filterObject = getFilterKeyAndValueFromParam(val);
      // in history collection query made will be in field data array,
      // hence 'data.' is added to filterKey
      const dataArrayFilterKey = `${filterObject.filterKey}`;
      const query = getQueryFromFilter(dataArrayFilterKey, filterObject.filterValue, typeName);
      return query;
    });
    // make and/or query
    queryParams[`$${lowerCaseFilterKey}`] = await Promise.all(queryPromiseArray);
    queryParams = modifyParamForQueryInHistoryCollection(queryParams, true);
  } else {
    // query is made in data field in history collection

    const dataArrayFilterKey = `${filterKey}`;
    queryParams = await getQueryFromFilter(dataArrayFilterKey, filterValue, typeName);
    queryParams = modifyParamForQueryInHistoryCollection(queryParams, false);
  }
  /* eslint-enable no-use-before-define  */
  return queryModel.fetchMultiple(queryParams);
};

const getQueryParamsForHistoryFilter = async (filterParam, typeName) => {
  const queryParams = {};
  const historyElements = await getModelsFromHistoryCollection(filterParam, typeName);
  let allModelsIds = historyElements.map((el) => {
    if (el && el.data && el.data.length) {
      const id = get(el, 'data[0].id');
      return id;
    }
    return null;
  });
  allModelsIds = without(allModelsIds, null);
  queryParams.id = { $in: allModelsIds };
  return queryParams;
};

const generateQueryParamsForRelationFilter = async (relatedType,
  filterParam, fieldName, isNoneFilter) => {
  let queryParams = {};
  const { filterKey, filterValue } = getFilterKeyAndValueFromParam(filterParam);

  const isModelHistoryField = fieldName === historyFieldName;
  if (isModelHistoryField) {
    /* eslint-disable no-use-before-define  */
    const typeName = relatedType.replace('History', '');
    queryParams = await getQueryParamsForHistoryFilter(filterParam, typeName);
    return queryParams;
  }

  if (filterKey === allFilters.and || filterKey === allFilters.AND) {
    queryParams = await getAndOrArrayRelationFilterValue('and', {
      filterValue, relatedType, fieldName, isNoneFilter,
    });
  } else if (filterKey === allFilters.or || filterKey === allFilters.OR) {
    queryParams = await getAndOrArrayRelationFilterValue('or', {
      filterValue, relatedType, fieldName, isNoneFilter,
    });
  } else {
    const { queryParamObject } = await getQueryParamsForRelationFilterSubSet(filterParam,
      relatedType, fieldName, isNoneFilter);
    queryParams = queryParamObject;
  }
  /* eslint-enable no-use-before-define  */
  return queryParams;
};

const generateQueryParamsForFilter = (
  filterTypeName,
  filterKey,
  filterValue,
  modelName,
) => {
  const queryParams = {};
  switch (filterTypeName) {
    case allFilters.not: {
      queryParams[filterKey] = { $ne: filterValue };
      break;
    }
    case allFilters.in: {
      queryParams[filterKey] = { $in: filterValue };
      break;
    }
    case allFilters.lt: {
      queryParams[filterKey] = { $lt: filterValue ? new Date(filterValue) : '' };
      break;
    }
    case allFilters.lte: {
      queryParams[filterKey] = { $lte: filterValue ? new Date(filterValue) : '' };
      break;
    }
    case allFilters.gt: {
      queryParams[filterKey] = { $gt: filterValue ? new Date(filterValue) : '' };
      break;
    }
    case allFilters.gte: {
      queryParams[filterKey] = { $gte: filterValue ? new Date(filterValue) : '' };
      break;
    }
    case allFilters.contains: {
      queryParams[filterKey] = { $regex: `.*${filterValue}.*`, $options: 'i' };
      break;
    }
    case allFilters.startsWith: {
      queryParams[filterKey] = { $regex: `^${filterValue}`, $options: 'i' };
      break;
    }
    case allFilters.endsWith: {
      queryParams[filterKey] = { $regex: `${filterValue}$`, $options: 'i' };
      break;
    }
    case allFilters.exists: {
      /*
      fieldName: "" , null,[], {}, not exist
      exists-->false will be
        1) fieldName --> not exist or
        2) fieldName exists but fieldName: "" , null,[], {}
      exists-->true will be
        1) fieldName --> exist and
        2) not fieldName: "" , null,[], {}
       */

      const relatedType = get(parsedASTMap[modelName], `field[${filterKey}].type.dataType`);
      const isList = get(parsedASTMap[modelName], `field[${filterKey}].type.isList`);
      const nonScalarKind = get(parsedASTMap, `[${relatedType}].kind`);

      if (filterValue) {
        if (!scalarTypes.includes(relatedType) && nonScalarKind && isList) {
          // check for "" , null
          queryParams[filterKey] = { $exists: filterValue, $ne: [] };
        } else if (!scalarTypes.includes(relatedType) && nonScalarKind && !isList) {
          queryParams[filterKey] = { $exists: filterValue, $nin: ['', null, {}] };
        } else {
          queryParams[filterKey] = { $exists: filterValue };
        }
      } else if (!scalarTypes.includes(relatedType) && nonScalarKind && isList) {
        Object.assign(queryParams, {
          $or: [
            { [filterKey]: { $exists: true, $eq: [] } },
            { [filterKey]: { $exists: false } },
          ],
        });
      } else if (!scalarTypes.includes(relatedType) && nonScalarKind && !isList) {
        Object.assign(queryParams,
          {
            $or: [
              { [filterKey]: { $exists: true, $in: ['', null, {}] } },
              { [filterKey]: { $exists: false } },
            ],
          });
      } else {
        // case of scaler types
        queryParams[filterKey] = { $exists: filterValue };
      }
      break;
    }
    default:
      queryParams[filterKey] = filterValue;
  }
  return queryParams;
};

const generateQueryParamsForNotFilter = (filterTypeName, filterKey, filterValue) => {
  const queryParams = {};
  switch (filterTypeName) {
    case allFilters.in: {
      queryParams[filterKey] = { $nin: filterValue };
      break;
    }
    case allFilters.contains: {
      queryParams[filterKey] = { $regex: `^((?!${filterValue}).)*$`, $options: 'i' };
      break;
    }
    case allFilters.startsWith: {
      queryParams[filterKey] = { $regex: `^((?!${filterValue}))`, $options: 'i' };
      break;
    }
    case allFilters.endsWith: {
      queryParams[filterKey] = { $regex: `.*(?<!${filterValue})$`, $options: 'i' };
      break;
    }
    /* no default */
  }
  return queryParams;
};

// returns a mongo query from filterKey and filterValue
const getQueryFromFilter = async (filterKey, filterValue, modelName) => {
  const queryParams = {};
  if (includes(filterKey, 'subDoc')) {
    let splitArray;
    if (!includes(filterKey, '_subDoc_')) {
      splitArray = filterKey.split('_subDoc');
    } else {
      splitArray = filterKey.split('_subDoc_');
    }
    const splitSubDoCFields = splitArray[0].split('_');
    let newFilterKey = '';
    for (let i = 0; i < splitSubDoCFields.length; i += 1) {
      if (i !== splitSubDoCFields.length - 1) {
        newFilterKey += `${splitSubDoCFields[i]}.`;
      } else {
        newFilterKey += splitSubDoCFields[i];
      }
    }
    /* splitArray will either be one or two, 1 when its exact matching and 2 when there
    is some expression like $ne, $in
    */
    if (splitArray.length === 2) {
      if (includes(splitArray[1], 'not')) {
        // if the field name contains not_ type
        const filterTypeName = splitArray[1].split('not_')[1];
        const notQueryParams = generateQueryParamsForNotFilter(
          filterTypeName,
          newFilterKey,
          filterValue,
        );
        Object.assign(queryParams, notQueryParams);
      } else {
        const filterTypeName = splitArray[1];
        const filterQueryParams = generateQueryParamsForFilter(
          filterTypeName,
          newFilterKey,
          filterValue,
        );
        Object.assign(queryParams, filterQueryParams);
      }
    } else {
      queryParams[newFilterKey] = filterValue;
    }
  } else {
    // spliting param key eg: username_starts_with
    const splitArray = split(filterKey, '_');
    const fieldName = splitArray[0];
    // if no underscore do basic search
    if (splitArray.length === 1) {
      queryParams[filterKey] = filterValue;
    } else if (splitArray.length === 2) {
      // if length is two first is fieldName then filter criteria
      switch (splitArray[1]) {
        case allFilters.none: {
          const relatedType = parsedASTMap[modelName].field[fieldName].type.dataType;

          const queryFilter = await generateQueryParamsForRelationFilter(relatedType,
            filterValue, fieldName, true);
          Object.assign(queryParams, queryFilter);
          break;
        }
        case allFilters.some: {
          const relatedType = parsedASTMap[modelName].field[fieldName].type.dataType;
          const queryFilter = await generateQueryParamsForRelationFilter(relatedType,
            filterValue, fieldName, false);
          Object.assign(queryParams, queryFilter);
          break;
        } default: {
          const filterQueryParams = generateQueryParamsForFilter(
            splitArray[1],
            fieldName,
            filterValue,
            modelName,
          );
          Object.assign(queryParams, filterQueryParams);
        }
      }
    } else if (splitArray.length === 3) {
      // if length is 3 there must be a not in param key, so does a not search
      switch (splitArray[1]) {
        case allFilters.not: {
          const filterTypeName = splitArray[2];
          const notQueryParams = generateQueryParamsForNotFilter(
            filterTypeName,
            fieldName,
            filterValue,
          );
          Object.assign(queryParams, notQueryParams);
          break;
        }
        default: {
          // if array element is 3, it must contain not
          throw new NotFilterRequiredError();
        }
      }
    }
  }
  return queryParams;
};
// returns resolved query from promise
const getResolvedQuery = (queryParams) => {
  const query = queryParams;
  // checking if key is and || or
  const firstKey = Object.keys(queryParams)[0];
  if (firstKey === '$and' || firstKey === '$or') {
    return queryParams[firstKey].then((paramValue) => {
      if (paramValue.length === 0) {
        delete query[firstKey];
      } else {
        query[firstKey] = paramValue;
      }
      return query;
    });
  }
  return query.then((resolvedQuery) => resolvedQuery);
};

/* eslint-disable no-use-before-define */
const getQueryFromFilterArray = (filterValues, modelName) => Promise.all(filterValues.map((filterObject) => {
  const object = {
    filter: filterObject,
  };
    // Recursive AND OR for nested filters
  return getQueryParams(object, modelName);
}));
/* eslint-enable no-use-before-define */

/* loop through filter keys and replace the filters with mongo queries accordingly
returns a promise which on resolve gives query */
const getQueryParams = (params, modelName) => {
  let queryParams = {};

  const { filterKey, filterValue } = getFilterKeyAndValueFromParam(params.filter);
  if (params.filter) {
    if (filterKey === allFilters.and || filterKey === allFilters.AND) {
      queryParams.$and = getQueryFromFilterArray(filterValue, modelName);
    } else if (filterKey === allFilters.or || filterKey === allFilters.OR) {
      queryParams.$or = getQueryFromFilterArray(filterValue, modelName);
    } else {
      queryParams = getQueryFromFilter(filterKey, filterValue, modelName);
    }
  }

  // resolve promise array in and & or
  const resolvedQuery = getResolvedQuery(queryParams);
  return resolvedQuery;
};

export default getQueryParams;
