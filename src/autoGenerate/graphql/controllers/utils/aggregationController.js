/* eslint-disable no-await-in-loop */
import { AggregationBuilder } from 'mongodb-aggregation-builder';
import { ConditionPayload, EqualityPayload } from 'mongodb-aggregation-builder/helpers';
import { get } from 'lodash';
import { getTypeDirectiveArgumentValue } from '../../../utils/getDirectiveArgumentValue';
import { META, dbControllerModes, defaultLimitValue } from '../../../../../constants';
import { getFieldsBeingFetched, getParsedASTMap } from '../../../utils';
import { types } from '../../../../../utils';
import parseGraphqlResolveInfo from '../../../../../utils/parseGraphqlResolveInfo';
import { paginationKeys } from '../QueryController/paginate';
import getSortOrder from '../QueryController/sorts';
import getQueryParams from '../QueryController/filters';

const parsedASTMap = getParsedASTMap(types);

/**
 * TODO
 * - 1. Condition to check if aggregation allowed........[DONE]
 * - 2. Generic Nested Lookup for Relational Fields......[DONE]
 * - 2. Projection Logic.................................[DONE]
 * - 3. Nested Relational filters ??.....................[DONE]
 * - 4. Top Level Relational filters ....................TODO
 * - 5. Nested Object Lookup ............................TODO [V2]
 * - 6. Resolver for Meta Fields ........................TODO [V2]
 */

// Extract pagination and filter params from requested fields.
const getPaginationAndFilterParams = async ({
  inputParams,
  modelName,
  allowDefault = false,
  allowDefaultSort = false,
}) => {
  // Parsed inputParams post paginationKeys method execution
  const allParams = paginationKeys(inputParams);
  const {
    lastValue, skipValue, afterId, beforeId,
  } = allParams;
  let { firstValue } = allParams;
  const params = allParams.inputParams;
  if (!firstValue && allowDefault) {
    firstValue = defaultLimitValue;
  }
  if (allowDefault) firstValue = firstValue > defaultLimitValue ? defaultLimitValue : firstValue;

  const limitValue = lastValue || firstValue || 0;

  let querySort = params && params.orderBy ? getSortOrder(params.orderBy) : {};
  if (Object.keys(querySort).length === 0 && (firstValue || lastValue || skipValue
    || afterId || beforeId) && allowDefaultSort) {
    querySort = { createdAt: 1 };
  }
  delete params.orderBy;
  if (afterId) { params.id = { $gt: `${afterId}` }; } else if (beforeId) { params.id = { $lt: `${beforeId}` }; }

  if (params.filter) {
    const data = await getQueryParams(params, modelName);
    if (afterId) { data.id = { $gt: `${afterId}` }; } else if (beforeId) { data.id = { $lt: `${beforeId}` }; }

    return {
      filter: data, limit: limitValue, skip: skipValue, sort: querySort,
    };
  }
  return {
    filter: {},
    limit: limitValue,
    skip: skipValue,
    sort: querySort,
  };
};

// Add filters and pagination params to current aggregation instance.
const buildPaginationStage = async ({
  params,
  typeName,
  aggregationBuilder,
}) => {
  const {
    filter, limit, skip, sort,
  } = await getPaginationAndFilterParams({
    inputParams: params,
    modelName: typeName,
    allowDefaultSort: true,
  });

  if (filter && Object.keys(filter).length) aggregationBuilder.Match(filter);
  if (sort && Object.keys(sort).length) aggregationBuilder.Sort(sort);
  if (skip) aggregationBuilder.Skip(skip);
  if (limit) aggregationBuilder.Limit(limit);

  return aggregationBuilder;
};

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

/**
 * Building Lookup Stages based on nested pipeline
 */
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

const buildAggregationPipeline = async ({
  fieldsForFetch,
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
      aggregationBuilder = await buildPaginationStage({
        params: parsedInfoMap.args || {},
        typeName,
        aggregationBuilder,
      });
    }

    // Loop through all the requested fields to build Lookup and Projection Stages.
    // eslint-disable-next-line no-restricted-syntax
    for (const fieldName of Object.keys(fieldsForFetch)) {
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
        const nestedPipeline = await buildAggregationPipeline({
          fieldsForFetch: fieldsForFetch[fieldName],
          parsedInfoMap:
            parsedInfoMap ? parsedInfoMap.fieldsByTypeName[typeName][fieldName] : {},
          typeName: relationalTypeName,
          builderInstance: nestedBuilder,
          nestedInstance: true,
        });

        // Build Lookup Stage to resolve required relational fields.
        aggregationBuilder = await buildLookupStage({
          nestedPipeline,
          builderInstance: aggregationBuilder,
          relationalTypeName,
          fieldName,
          fieldParams,
        });
      }
    }

    // Build Projection Stage to constraint required data from DB.
    aggregationBuilder = await buildProjectionMapStage({
      builderInstance: aggregationBuilder,
      fieldsForFetch,
      field,
    });
  }
  return aggregationBuilder;
};

const checkIfAggregationAllowed = ({ typeName }) => {
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

const constructAggregationQuery = async ({
  typeName,
  info,
}, additionalParams = {}) => {
  const { fieldNodes } = info;
  const fieldsForFetch = getFieldsBeingFetched(fieldNodes);
  const parsedInfoMap = parseGraphqlResolveInfo(info);
  let aggregationController = new AggregationBuilder(typeName);

  if (checkIfAggregationAllowed({ typeName })) {
    const {
      filters = {}, limit = 0, skip = 0, sort = {},
    } = additionalParams;

    if (filters && Object.keys(filters).length) aggregationController.Match(filters);
    if (sort && Object.keys(sort).length) aggregationController.Sort(sort);
    if (skip) aggregationController.Skip(skip);
    if (limit) aggregationController.Limit(limit);

    aggregationController = await buildAggregationPipeline({
      fieldsForFetch,
      parsedInfoMap,
      typeName,
      builderInstance: aggregationController,
    });
  }
  return {
    controller: aggregationController,
    pipelineStages: aggregationController.getPipeline({ allowEmpty: true }),
    name: typeName,
  };
};

export { constructAggregationQuery, checkIfAggregationAllowed };
