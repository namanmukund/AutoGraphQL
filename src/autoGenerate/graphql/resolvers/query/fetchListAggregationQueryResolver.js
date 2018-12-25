import { QueryController } from '../../controllers';
import { validate } from '../../validation';
import { getFieldsBeingFetched } from '../../../utils';
import { operationName } from '../../../../../constants';

const fetchListAggregationQueryResolver = (
  root,
  params,
  typeName,
  info,
  ast,
  authentication,
) => {
  const modelQueries = new QueryController(typeName, authentication);
  const { fieldNodes } = info; // Fields which are requested.
  const feildsFetched = getFieldsBeingFetched(fieldNodes);

  const typeAST = ast[typeName];
  validate(operationName.read, typeAST, feildsFetched, authentication);

  return modelQueries.fetchCount(params).then((res) => {
    const { groupByFieldName, groupByResult } = res;
    // simply return count if it is not groupBy type
    if (!groupByFieldName) {
      return {
        count: res,
      };
    }
    let totalCount = 0;
    const groupByData = [];
    groupByResult.forEach((data) => {
      const { _id: groupByFieldValue, count: groupByCount } = data;
      groupByData.push({
        groupByFieldValue,
        count: groupByCount,
      });
      totalCount += groupByCount;
    });
    return {
      count: totalCount,
      groupByFieldName,
      groupByData,
    };
  });
};

export default fetchListAggregationQueryResolver;
