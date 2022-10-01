import { paginationKeys } from '../QueryController/paginate';
import getSortOrder from '../QueryController/sorts';
import getQueryParams from '../QueryController/filters';
import { defaultLimitValue } from '../../../../../constants';

// Extract pagination and other filter params from (info) requested fields.
const getPaginationAndFilterParams = async ({
  inputParams,
  modelName,
  allowDefaultLimit = false,
  allowDefaultSort = false,
}) => {
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
  const initialParams = params;
  if (!firstValue && allowDefaultLimit) {
    firstValue = defaultLimitValue;
  }
  if (allowDefaultLimit) {
    firstValue = firstValue > defaultLimitValue ? defaultLimitValue : firstValue;
  }

  const limitValue = lastValue || firstValue || 0;

  let querySort = params && params.orderBy ? getSortOrder(params.orderBy) : {};
  if (
    Object.keys(querySort).length === 0
    && (firstValue || lastValue || skipValue || afterId || beforeId)
    && allowDefaultSort
  ) {
    querySort = { createdAt: 1 };
  }
  delete params.orderBy;
  if (afterId) {
    params.id = { $gt: `${afterId}` };
  } else if (beforeId) {
    params.id = { $lt: `${beforeId}` };
  }

  if (params.filter) {
    const data = await getQueryParams(params, modelName);
    if (afterId) {
      data.id = { $gt: `${afterId}` };
    } else if (beforeId) {
      data.id = { $lt: `${beforeId}` };
    }

    return {
      filter: data,
      limit: limitValue,
      skip: skipValue,
      sort: querySort,
      isLast: lastValue,
      initialParams,
    };
  }
  return {
    filter: inputParams || {},
    limit: limitValue,
    skip: skipValue || 0,
    sort: querySort,
    isLast: lastValue,
    initialParams,
  };
};

export default getPaginationAndFilterParams;
