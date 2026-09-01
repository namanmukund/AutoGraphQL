import MasterController from '../MasterController';
import getQueryParams from './filters';
import { PermissionDeniedError } from '../../../../../constants/errors';
import { defaultPermissionErrorMsg, historyFieldName } from '../../../../../constants';
import appendModelHistoryToQueriedResult from '../utils/appendModelHistoryToQueriedResult';
import AggregationController, { checkIfDatabaseAggregationAllowedOnType } from '../AggregationController';
import getPaginationAndFilterParams from '../utils/getPaginationAndFilterParams';
import { applyRowLevelSecurity } from '../../../../security/rls';
import { buildSequelizeWhereClause } from '../../../models/sqlModelGenerator';

const getQueriedResult = (Model, params, limitValue, skipValue, querySort) => {
  if (Model && (Model.isPgModel || typeof Model.findAll === 'function')) {
    const where = buildSequelizeWhereClause(params || {});
    return Model.findAll({
      where,
      limit: limitValue,
      offset: skipValue,
      order: querySort,
    }).then((records) => (Array.isArray(records) ? records.map((r) => (r && r.toJSON ? r.toJSON() : r)) : []))
      .catch((err) => err);
  }
  return Model.find(params).limit(limitValue).skip(skipValue).sort(querySort)
    .exec()
    .catch((err) => err);
};

const getQueriedResultFromLast = (Model, params, limitValue, skipValue, querySort) => {
  if (Model && (Model.isPgModel || (typeof Model.count === 'function' && typeof Model.findAll === 'function'))) {
    const where = buildSequelizeWhereClause(params || {});
    return Model.count({ where }).then((result) => {
      const valueSkip = result - limitValue - skipValue > 0 ? result - limitValue - skipValue : 0;
      return Model.findAll({
        where,
        limit: limitValue,
        offset: valueSkip,
        order: querySort,
      }).then((records) => (Array.isArray(records) ? records.map((r) => (r && r.toJSON ? r.toJSON() : r)) : []))
        .catch((err) => err);
    });
  }
  return Model.find(params).count().exec().then((result) => {
    const valueSkip = result - limitValue - skipValue > 0 ? result - limitValue - skipValue : 0;
    return Model.find(params).limit(limitValue).skip(valueSkip).sort(querySort)
      .exec()
      .catch((err) => err);
  });
};

const checkIfModelHistoryInParams = (params) => {
  const stringifiedParams = JSON.stringify(params);
  if (stringifiedParams.includes(historyFieldName)) {
    return true;
  }
  return false;
};

class QueryController extends MasterController {
  getQueriedResultFromController = async (params, limitValue, skipValue, querySort, isLast = false, resolverInfoParams) => {
    if (this.Model && !this.Model.isPgModel && resolverInfoParams && resolverInfoParams.typeName && checkIfDatabaseAggregationAllowedOnType(resolverInfoParams)) {
      let skipCount = skipValue;
      // If last document are requested calculate total count and skip accordingly.
      if (isLast) {
        const totalDocCount = await Model.find(params).count().exec();
        skipCount = totalDocCount - limitValue - skipValue > 0 ? totalDocCount - limitValue - skipValue : 0;
      }
      // Building Aggregation Pipeline Stages with Filter and requested fields.
      const aggregationController = new AggregationController(resolverInfoParams);
      const {
        pipelineStages: aggregationQuery,
      } = await aggregationController.constructQuery({
        filters: params,
        limit: limitValue,
        skip: skipCount,
        sort: querySort,
      });
      return this.Model.aggregate(aggregationQuery).exec();
    }
    // If Aggregation is not allowed only fetch data for particular type.
    if (isLast) {
      return getQueriedResultFromLast(this.Model, params, limitValue, skipValue, querySort);
    }
    return getQueriedResult(this.Model, params, limitValue, skipValue, querySort);
  }

  fetchById(id, context) {
    const activeContext = context || this.authentication;
    try {
      applyRowLevelSecurity({
        modelName: this.modelName,
        filter: { id },
        context: activeContext,
      });
    } catch (rlsErr) {
      return Promise.reject(rlsErr);
    }

    return this.validatePermissions({ id }, true)
      .then((isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        const requestLoaders = (context && context.loaders)
          || this.loaders
          || (this.authentication && this.authentication.loaders);
        if (requestLoaders && typeof requestLoaders.getLoader === 'function') {
          const loader = requestLoaders.getLoader(this.modelName);
          if (loader) {
            return loader.load(id);
          }
        }
        if (this.Model && (this.Model.isPgModel || (typeof this.Model.findOne === 'function' && !this.Model.find))) {
          return this.Model.findOne({ where: { id } })
            .then((r) => (r && r.toJSON ? r.toJSON() : r));
        }
        // use lean to get working object instead of mongoose
        return this.Model.findOne({ id })
          .lean()
          .exec();
      })
      .then((res) => res)
      .catch((err) => err);
  }

  fetchOne(param, resolverInfoParams, context) {
    const activeContext = context || (resolverInfoParams && resolverInfoParams.context) || this.authentication;
    let effectiveParam = param;
    try {
      effectiveParam = applyRowLevelSecurity({
        modelName: this.modelName,
        filter: param,
        context: activeContext,
      });
    } catch (rlsErr) {
      return Promise.reject(rlsErr);
    }

    return this.validatePermissions({ param: effectiveParam }, true)
      .then((isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        if (resolverInfoParams && checkIfDatabaseAggregationAllowedOnType(resolverInfoParams)) {
          return new AggregationController(resolverInfoParams)
            .constructQuery({
              filters: effectiveParam,
            }).then(async ({ pipelineStages: aggregationQuery }) => {
              const result = await this.Model.aggregate(aggregationQuery).exec();
              return Array.isArray(result) ? result[0] : result;
            });
        }
        const paramKeys = effectiveParam ? Object.keys(effectiveParam) : [];
        const requestLoaders = (context && context.loaders)
          || (resolverInfoParams && resolverInfoParams.context && resolverInfoParams.context.loaders)
          || this.loaders
          || (this.authentication && this.authentication.loaders);
        if (requestLoaders && typeof requestLoaders.getLoader === 'function' && paramKeys.length === 1 && effectiveParam.id) {
          const loader = requestLoaders.getLoader(this.modelName);
          if (loader) {
            return loader.load(effectiveParam.id);
          }
        }
        if (this.Model && (this.Model.isPgModel || (typeof this.Model.findOne === 'function' && !this.Model.find))) {
          return this.Model.findOne({ where: effectiveParam })
            .then((r) => (r && r.toJSON ? r.toJSON() : r));
        }
        return this.Model.findOne(effectiveParam)
          .lean()
          .exec();
      })
      .then((res) => res)
      .catch((err) => err);
  }

  /*
Sample paramsForFetch argument
{
  "filter": {
    "and": [
      {
        "status_exists": true
      },
      {
        "order_gt": 0
      }
    ]
  },
  "orderBy": "order_ASC",
  "first": 5,
  "skip": 1
}
 */
  fetchMany(paramsForFetch = {}, resolverInfoParams = {}, context = null) {
    const activeContext = context || (resolverInfoParams && resolverInfoParams.context) || this.authentication;
    let inputParams = { ...paramsForFetch };

    try {
      if (inputParams.filter) {
        inputParams.filter = applyRowLevelSecurity({
          modelName: this.modelName,
          filter: inputParams.filter,
          context: activeContext,
        });
      } else {
        const secured = applyRowLevelSecurity({
          modelName: this.modelName,
          filter: {},
          context: activeContext,
        });
        if (Object.keys(secured).length > 0) {
          inputParams.filter = secured;
        }
      }
    } catch (rlsErr) {
      return Promise.reject(rlsErr);
    }
    return this.validatePermissions(inputParams, true)
      .then((isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        if (isAllowed.status && isAllowed.data) {
          inputParams = isAllowed.data;
        }
        return getPaginationAndFilterParams({
          inputParams,
          modelName: this.modelName,
          allowDefaultSort: true,
          allowDefaultLimit: true,
        }).then(({
          filter, limit: limitValue, skip: skipValue, sort: querySort, isLast = false, initialParams: params,
        }) => this.getQueriedResultFromController(filter, limitValue, skipValue, querySort, isLast, resolverInfoParams)
          .then((res) => {
            // if model history params sent in arg then append history to result
            const isModelHistoryInParams = checkIfModelHistoryInParams(params);
            if (isModelHistoryInParams) {
              const resultWithAppendedHistory = appendModelHistoryToQueriedResult(res,
                this.modelName);
              return resultWithAppendedHistory;
            }
            return res;
          }));
      });
  }

  // for fetching without graphql
  fetchMultiple(inputParams = {}) {
    this.validate();
    this.validateStatus();
    return this.Model.find(inputParams).exec();
  }

  fetchCount(paramsForFetch = {}) {
    let inputParams = { ...paramsForFetch };
    return this.validatePermissions(inputParams, true)
      .then(async (isAllowedParam) => {
        const isAllowed = isAllowedParam;
        if (!isAllowed.status) {
          if (!isAllowed.data) {
            isAllowed.data = defaultPermissionErrorMsg;
          }
          throw new PermissionDeniedError({
            data: {
              message: isAllowed.data,
            },
          });
        }
        if (isAllowed.status && isAllowed.data) {
          inputParams = isAllowed.data;
        }
        const { filter, groupBy } = inputParams;
        if (filter) {
          const queryParams = getQueryParams(inputParams, this.modelName);
          if (!groupBy) {
            return queryParams.then((query) => this.Model.count(query).exec());
          }
          // filter with groupBy
          return queryParams.then(async (query) => {
            const data = {
              groupByFieldName: groupBy,
              groupByResult: await this.Model.aggregate([
                { $match: query },
                { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
              ]).exec(),
            };
            return data;
          });
        }
        if (!filter && groupBy) {
          return {
            groupByFieldName: groupBy,
            groupByResult: await this.Model.aggregate([
              { $match: {} },
              { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
            ]).exec(),
          };
        }

        return this.Model.count(inputParams).exec();
      }).catch((err) => err);
  }

  aggregate(aggregateQuery) {
    this.validate();
    this.validateStatus();
    return this.Model.aggregate(aggregateQuery);
  }
}

export default QueryController;
