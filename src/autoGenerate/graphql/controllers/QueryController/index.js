import MasterController from '../MasterController';
import getQueryParams from './filters';
import getSortOrder from './sorts';
import { paginationKeys } from './paginate';
import { PermissionDeniedError } from '../../../../../constants/errors';
import { defaultPermissionErrorMsg, defaultLimitValue, historyFieldName } from '../../../../../constants';
import appendModelHistoryToQueriedResult from '../utils/appendModelHistoryToQueriedResult';

const getQueriedResult = (Model, params, limitValue, skipValue, querySort) => Model.find(params).limit(limitValue).skip(skipValue).sort(querySort)
  .exec()
  .catch((err) => err);

const getQueriedResultFromLast = (Model, params, limitValue, skipValue, querySort) => Model.find(params).count().exec().then((result) => {
  const valueSkip = result - limitValue - skipValue > 0 ? result - limitValue - skipValue : 0;
  return Model.find(params).limit(limitValue).skip(valueSkip).sort(querySort)
    .exec()
    .catch((err) => err);
});

const checkIfModelHistoryInParams = (params) => {
  const stringifiedParams = JSON.stringify(params);
  if (stringifiedParams.includes(historyFieldName)) {
    return true;
  }
  return false;
};

class QueryController extends MasterController {
  fetchById(id) {
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
        // use lean to get working object instead of mongoose
        return this.Model.findOne({ id })
          .lean()
          .exec();
      })
      .then((res) => res)
      .catch((err) => err);
  }

  fetchOne(param) {
    return this.validatePermissions({ param }, true)
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
        return this.Model.findOne(param).exec();
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
  fetchMany(paramsForFetch = {}, pipelineStages = []) {
    let inputParams = { ...paramsForFetch };
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
        /* Parsed inputParams post paginationKeys method execution
        {
        "afterId": undefined,
        "beforeId": undefined,
        "skipValue": 1,
        "firstValue": 5,
        "lastValue": undefined,
        "inputParams": {
            "filter": {
                "and": [{
                        "status_exists": true
                    },
                    {
                        "order_gt": 0
                    }
                ]
            },
            "orderBy": "order_ASC"
        }
       }
     */
        const allParams = paginationKeys(inputParams);
        const {
          lastValue, skipValue, afterId, beforeId,
        } = allParams;
        let { firstValue } = allParams;
        const params = allParams.inputParams;
        if (!firstValue) {
          firstValue = defaultLimitValue;
        }
        firstValue = firstValue > defaultLimitValue ? defaultLimitValue : firstValue;
        /* querySort for above example will be
           {
            "order": 1
           }
         */
        let querySort = params && params.orderBy ? getSortOrder(params.orderBy) : {};
        if (Object.keys(querySort).length === 0 && (firstValue || lastValue || skipValue
          || afterId || beforeId)) {
          querySort = { createdAt: 1 };
        }
        delete params.orderBy;
        if (afterId) { params.id = { $gt: `${afterId}` }; } else if (beforeId) { params.id = { $lt: `${beforeId}` }; }
        if (params.filter) {
          const queryParams = getQueryParams(params, this.modelName);
          return queryParams.then((query) => {
            /* queryParams or query for above examples
          {
              "$and": [
                {
                  "status": {
                    "$exists": true
                  }
                },
                {
                  "order": {
                    "$gt": 0
                  }
                }
              ]
            }
           */
            const data = query;
            if (afterId) { data.id = { $gt: `${afterId}` }; } else if (beforeId) { data.id = { $lt: `${beforeId}` }; }
            /**
             * @TODO Append more stages i.e match, skip, first......
             */
            if (pipelineStages && pipelineStages.length) {
              return this.Model.aggregate(pipelineStages)
                .then((res) => {
                  // if model history params sent in arg then append history to result
                  const isModelHistoryInParams = checkIfModelHistoryInParams(params);
                  if (isModelHistoryInParams) {
                    const resultWithAppendedHistory = appendModelHistoryToQueriedResult(res,
                      this.modelName);
                    return resultWithAppendedHistory;
                  }
                  return res;
                });
            }
            if (lastValue) {
              return getQueriedResultFromLast(this.Model, data, lastValue, skipValue, querySort)
                .then((res) => {
                  // if model history params sent in arg then append history to result
                  const isModelHistoryInParams = checkIfModelHistoryInParams(params);
                  if (isModelHistoryInParams) {
                    const resultWithAppendedHistory = appendModelHistoryToQueriedResult(res,
                      this.modelName);
                    return resultWithAppendedHistory;
                  }
                  return res;
                });
            }
            return getQueriedResult(this.Model, data, firstValue, skipValue, querySort)
              .then((res) => {
                // if model history params sent in arg then append history to result
                const isModelHistoryInParams = checkIfModelHistoryInParams(params);
                if (isModelHistoryInParams) {
                  const resultWithAppendedHistory = appendModelHistoryToQueriedResult(res,
                    this.modelName);
                  return resultWithAppendedHistory;
                }
                return res;
              });
          });
        }
        if (pipelineStages && pipelineStages.length) {
          /**
           * @TODO Append more stages i.e match, skip, first......
           */
          return this.Model.aggregate(pipelineStages);
        }
        if (lastValue) {
          return getQueriedResultFromLast(this.Model, params, lastValue, skipValue, querySort);
        }
        return getQueriedResult(this.Model, params, firstValue, skipValue, querySort);
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
