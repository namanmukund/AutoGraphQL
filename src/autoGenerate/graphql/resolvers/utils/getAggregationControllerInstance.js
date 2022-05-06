import { AggregationBuilder } from 'mongodb-aggregation-builder';
import { ConditionPayload, EqualityPayload } from 'mongodb-aggregation-builder/helpers';
import { get } from 'lodash';
import { getTypeDirectiveArgumentValue } from '../../../utils/getDirectiveArgumentValue';
import { META, optimizationModes } from '../../../../../constants';
import { getFieldsBeingFetched } from '../../../utils';

/**
 * TODO
 * - 1. RE-FACTOR CODE...................................[DONE]
 * - 2. RE-STRUCTURE CODE................................TODO
 * - 3. PROJECTION LOGIC.................................[PARTIAL]
 *      - Convert Lookup Arr O/P into Object Result........[PARTIAL]!
 *      - Consider Variables which are in filters
 *        too i.e local / Relational / Meta................TODO
 * - 4. Nested OR relational filters ??..................TODO
 * - 5. Nested Object Lookup ??..........................TODO [V2]
 * - 6. Resolver for Meta Fields ??......................TODO [V2]
 */

export const buildPipelineStages = ({
  fieldsForFetch,
  parsedASTMap,
  typeName,
  builderInstance,
}) => {
  if (builderInstance && builderInstance.getPipeline) {
    const { field } = parsedASTMap[typeName];
    const projectionMap = {};
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

        if (!get(fieldObj, 'type.isList', false)) projectionMap[fieldName] = { $arrayElemAt: [`$${fieldName}`, 0] };
        else projectionMap[fieldName] = 1;
      }
      if (get(fieldObj, 'directive.relationalMeta')) {
        const relationalFieldName = fieldName.split(META)[0];
        projectionMap[fieldName] = 1;
        projectionMap[relationalFieldName] = 1;
      } else if (!get(fieldObj, 'directive.relation')) projectionMap[fieldName] = 1;
      return builderInstance;
    });
    if (projectionMap && Object.keys(projectionMap).length) {
      builderInstance.Project(projectionMap);
    }
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
    const {
      filters, limit, skip, sort,
    } = additionalParams;

    if (filters && Object.keys(filters).length) aggregationController.Match(filters);
    if (sort) aggregationController.Sort(sort);
    if (skip) aggregationController.Skip(skip);
    if (limit) aggregationController.Limit(limit);

    aggregationController = buildPipelineStages({
      fieldsForFetch,
      parsedASTMap,
      typeName,
      builderInstance: aggregationController,
    });
  }
  return aggregationController;
};

export default getAggregationControllerInstance;
