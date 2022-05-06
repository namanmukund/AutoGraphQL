import { AggregationBuilder } from 'mongodb-aggregation-builder';
import { ConditionPayload, EqualityPayload } from 'mongodb-aggregation-builder/helpers';
import { get } from 'lodash';
import { getTypeDirectiveArgumentValue } from '../../../utils/getDirectiveArgumentValue';
import { optimizationModes } from '../../../../../constants';
import { getFieldsBeingFetched } from '../../../utils';

/**
 * TODO
 * - 1. RE-FACTOR CODE.                                  [DONE]
 * - 2. RE-STRUCTURE CODE.
 * - 3. PROJECTION LOGIC.
 *      - Convert Lookup Arr O/P into
 *        Object Result.
 *      - Consider Variables which are in filters
 *        too i.e local / Relational / Meta.
 * - 4. Nested Filters if applied on
 *      relational fields ??
 * - 5. Nested Object Lookup ??
 * - 6. Resolver for Meta Fields ??
 */

export const buildPipelineStages = ({
  fieldsForFetch,
  parsedASTMap,
  typeName,
  builderInstance,
}) => {
  if (builderInstance && builderInstance.getPipeline) {
    const { field } = parsedASTMap[typeName];
    Object.keys(fieldsForFetch).forEach((fieldName) => {
      const fieldObj = field[fieldName];
      if (fieldObj && fieldObj.directive.relation) {
        const relationalTypeName = fieldObj.type.dataType;
        const nestedBuilder = new AggregationBuilder(relationalTypeName);
        const nestedPipeline = buildPipelineStages({
          fieldsForFetch: fieldsForFetch[fieldName],
          parsedASTMap,
          typeName: relationalTypeName,
          builderInstance: nestedBuilder,
        });
        const nestedPipelineStages = nestedPipeline.getPipeline({
          allowEmpty: true,
        });
        if (nestedPipelineStages && nestedPipelineStages.length) {
          builderInstance.Lookup(
            ConditionPayload(relationalTypeName, fieldName, {
              variableList: [
                {
                  var: `${fieldName}Id`,
                  source: `${fieldName}.typeId`,
                  key: 'primary',
                  isList: get(fieldObj, 'type.isList', false),
                },
              ],
              nestedAggregation: nestedPipeline,
            }),
          );
        } else {
          builderInstance.Lookup(
            EqualityPayload(relationalTypeName, fieldName, `${fieldName}.typeId`, 'id'),
          );
        }
      }
      return builderInstance;
    });
  }
  return builderInstance;
};

export const checkIfAggregationEnabled = ({ parsedASTMap, typeName }) => {
  if (parsedASTMap && typeName) {
    const { directives } = parsedASTMap[typeName];
    /**
     * Get Optimization Mode from Type Definition
     * and build aggregation pipeline if required.
     */
    const typeOptimizationMode = getTypeDirectiveArgumentValue(
      directives,
      'optimization',
      'mode',
    ) || 'cascade';

    if (typeOptimizationMode !== optimizationModes.cascade) {
      return true;
    }
  }
  return false;
};
const getAggregationControllerInstance = ({
  typeName,
  parsedASTMap,
  info,
}, additionalParams) => {
  const { fieldNodes } = info;
  const fieldsForFetch = getFieldsBeingFetched(fieldNodes);
  let aggregationController = new AggregationBuilder(typeName);

  if (checkIfAggregationEnabled({ parsedASTMap, typeName })) {
    aggregationController = buildPipelineStages({
      fieldsForFetch,
      parsedASTMap,
      typeName,
      builderInstance,
    });
    if (additionalParams) {
      aggregationController
        .Match(params)
        .Limit(limitValue)
        .Skip(skipCount)
        .Sort(querySort)
        .getPipeline();
    }
  }
  return aggregationController;
};

export default getAggregationControllerInstance;
