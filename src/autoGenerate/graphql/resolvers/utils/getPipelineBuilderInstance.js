import { AggregationBuilder } from 'mongodb-aggregation-builder';
import { ConditionPayload, EqualityPayload } from 'mongodb-aggregation-builder/helpers';
import { get } from 'lodash';
import { getTypeDirectiveArgumentValue } from '../../../utils/getDirectiveArgumentValue';
import { optimizationModes } from '../../../../../constants';
import { getFieldsBeingFetched } from '../../../utils';

/**
 * TODO
 * - 1. RE-STRUCTURE CODE
 * - 2. PROJECTION LOGIC
 * - 3. NESTED OBJECT LOOKUP ??
 */

const buildPipelineStages = ({
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

const getPipelineBuilderInstance = ({
  typeName,
  parsedASTMap,
  info,
}) => {
  const { directives } = parsedASTMap[typeName];
  const { fieldNodes } = info;
  const fieldsForFetch = getFieldsBeingFetched(fieldNodes);

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
    const builderInstance = new AggregationBuilder(typeName);
    return buildPipelineStages({
      fieldsForFetch,
      parsedASTMap,
      typeName,
      builderInstance,
    });
  }
  return null;
};

export default getPipelineBuilderInstance;
