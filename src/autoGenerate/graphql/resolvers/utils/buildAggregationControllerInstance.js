import { AggregationBuilder } from 'mongodb-aggregation-builder';
import { ConditionPayload, EqualityPayload } from 'mongodb-aggregation-builder/helpers';
import { get } from 'lodash';
import { getTypeDirectiveArgumentValue } from '../../../utils/getDirectiveArgumentValue';
import { META, dbControllerModes } from '../../../../../constants';
import { getFieldsBeingFetched } from '../../../utils';
import parseGraphqlResolveInfo from '../../../../../utils/parseGraphqlResolveInfo';

/**
 * TODO
 * - 1. Condition to check if aggregation enabled........[DONE]
 * - 1. Generic Lookup for Relational Fields.............[DONE]
 * - 1. Nested Lookup for Relational Fields..............[DONE]
 * - 2. Projection Logic.................................[PARTIAL]
 *      - Convert Lookup Arr O/P into Object Result........[DONE]
 *      - Consider Variables which are in filters
 *        too i.e local / Relational / Meta................TODO
 * - 3. Nested or relational filters ??..................TODO
 * - 4. Nested Object Lookup ............................TODO [V2]
 * - 5. Resolver for Meta Fields ........................TODO [V2]
 */

/**
 * Building Projection Stage
 * @example_1 fieldName -> { id: "..." }
 *    OR { fieldName : [{....}] } [Relational List Field]
 * Output -> { fieldName: 1 }
 * @example_2 fieldName -> { fieldName: {...} } [Relational Object Field]
 * Output -> { fieldName: { $arrayElemAt: [$fieldName, 0] } }
 */
const buildProjectionMapStage = ({
  builderInstance,
  fieldsForFetch,
  field,
}) => {
  const aggregationBuilder = builderInstance;
  const projectionMap = {};

  Object.keys(fieldsForFetch).forEach((fieldName) => {
    const fieldParams = field[fieldName];
    if (get(fieldParams, 'directive.relationalMeta')) {
      const relationalFieldName = fieldName.split(META)[0];
      projectionMap[fieldName] = 1;
      projectionMap[relationalFieldName] = 1;
    } else if (get(fieldParams, 'directive.relation') && !get(fieldParams, 'type.isList', false)) {
      projectionMap[fieldName] = { $arrayElemAt: [`$${fieldName}`, 0] };
    } else { projectionMap[fieldName] = 1; }
  });

  if (projectionMap && Object.keys(projectionMap).length) {
    aggregationBuilder.Project(projectionMap);
  }
  return aggregationBuilder;
};

const buildLookupStage = ({
  nestedPipeline,
  builderInstance,
  relationalTypeName,
  fieldName,
  fieldParams,
}) => {
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
            isList: get(fieldParams, 'type.isList', false),
          },
        ],
        nestedAggregation: nestedPipeline,
      }),
    );
  } else {
    builderInstance.Lookup(
      EqualityPayload(
        relationalTypeName,
        fieldName,
        `${fieldName}.typeId`,
        'id',
      ),
    );
  }
  return builderInstance;
};

export const buildAggregationPipeline = ({
  fieldsForFetch,
  parsedASTMap,
  parsedInfoMap,
  typeName,
  builderInstance,
  nestedInstance = false,
}) => {
  let aggregationBuilder = builderInstance;
  if (aggregationBuilder && aggregationBuilder.getPipeline) {
    const { field } = parsedASTMap[typeName];

    // Check if Filter Params exists for nested pipeline.
    if (nestedInstance && Object.keys(parsedInfoMap.args || {}).length) {
      /**
       * @TODO
       * 1. Extract pagination keys and
       *    get filters for nested lookup `Match` Stage.
       * 2. Apply Match + Pagination Stages for nested Aggregation.
       */
      aggregationBuilder.Match(parsedInfoMap.args.filter);
    }

    // Loop through all the requested fields to build Lookup and Projection Stages.
    Object.keys(fieldsForFetch).forEach((fieldName) => {
      const fieldParams = field[fieldName];
      // Check if it is a relational field
      if (get(fieldParams, 'directive.relation')) {
        // Get Relational Field Collection Name
        const relationalTypeName = fieldParams.type.dataType;
        /**
         * Recursively building aggregation pipeline to...
         * resolve nested fields.
         * Example
         * {
         *   field_1 {
         *      id
         *      nested_field_1 {
         *        id
         *      }
         *   }
         * }
         */
        const nestedBuilder = new AggregationBuilder(relationalTypeName);
        const nestedPipeline = buildAggregationPipeline({
          fieldsForFetch: fieldsForFetch[fieldName],
          parsedASTMap,
          parsedInfoMap:
            parsedInfoMap ? parsedInfoMap.fieldsByTypeName[typeName][fieldName] : {},
          typeName: relationalTypeName,
          builderInstance: nestedBuilder,
          nestedInstance: true,
        });

        // Build Lookup Stage to resolve required relational fields.
        aggregationBuilder = buildLookupStage({
          nestedPipeline,
          builderInstance: aggregationBuilder,
          relationalTypeName,
          fieldName,
          fieldParams,
        });
      }

      return aggregationBuilder;
    });

    // Build Projection Stage to constraint required data from DB.
    aggregationBuilder = buildProjectionMapStage({
      builderInstance: aggregationBuilder,
      fieldsForFetch,
      field,
    });
  }
  return aggregationBuilder;
};

export const checkIfAggregationEnabled = ({ parsedASTMap, typeName }) => {
  if (parsedASTMap && typeName) {
    const { directives } = parsedASTMap[typeName];
    /**
     * Get Controller Mode from Type Definition
     * and build aggregation pipeline if required.
     */
    const typeControllerMode = getTypeDirectiveArgumentValue(
      directives,
      'databaseController',
      'mode',
    ) || 'cascade';

    if (typeControllerMode !== dbControllerModes.cascade) {
      return true;
    }
  }
  return false;
};

const buildAggregationControllerInstance = ({
  typeName,
  parsedASTMap,
  info,
}, additionalParams) => {
  const { fieldNodes } = info;
  const fieldsForFetch = getFieldsBeingFetched(fieldNodes);
  const parsedInfoMap = parseGraphqlResolveInfo(info);
  let aggregationController = new AggregationBuilder(typeName);

  if (checkIfAggregationEnabled({ parsedASTMap, typeName })) {
    const {
      filters, limit, skip, sort,
    } = additionalParams;

    if (filters && Object.keys(filters).length) aggregationController.Match(filters);
    if (sort) aggregationController.Sort(sort);
    if (skip) aggregationController.Skip(skip);
    if (limit) aggregationController.Limit(limit);

    aggregationController = buildAggregationPipeline({
      fieldsForFetch,
      parsedASTMap,
      parsedInfoMap,
      typeName,
      builderInstance: aggregationController,
    });
  }
  return aggregationController;
};

export default buildAggregationControllerInstance;
