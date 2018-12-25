
const AggregationResult = `
  type AggregationResult {
   count: Int,
   groupByFieldName: String,
   groupByData: [GroupByAggregationResult]
 }`;

export default AggregationResult;
