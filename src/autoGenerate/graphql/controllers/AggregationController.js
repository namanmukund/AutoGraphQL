/* eslint-disable no-await-in-loop */
import { AggregationBuilder } from 'mongodb-aggregation-builder';
import { ConditionPayload, EqualityPayload } from 'mongodb-aggregation-builder/helpers';
import { get, truncate } from 'lodash';
import { getTypeDirectiveArgumentValue } from '../../utils/getDirectiveArgumentValue';
import { META, dbControllerModes, defaultLimitValue } from '../../../../constants';
import { getParsedASTMap } from '../../utils';
import { types } from '../../../../utils';
import parseGraphqlResolveInfo from '../../../../utils/parseGraphqlResolveInfo';
import { paginationKeys } from './QueryController/paginate';
import getSortOrder from './QueryController/sorts';
import getQueryParams from './QueryController/filters';

const parsedASTMap = getParsedASTMap(types);

// Allow Aggregation if databaseController directive
// exists on Type with mode as aggregation.
export const checkIfDatabaseAggregationAllowedOnType = ({ typeName }) => {
  if (parsedASTMap && typeName) {
    const { directives } = parsedASTMap[typeName];
    const typeControllerMode = getTypeDirectiveArgumentValue(
      directives,
      'databaseController',
      'mode',
    ) || 'cascade';

    if (typeControllerMode === dbControllerModes.aggregation) {
      return true;
    }
  }
  return false;
};

/**
 * TODO
 * - 1. Condition to check if aggregation allowed........[DONE]
 * - 2. Generic Nested Lookup for Relational Fields......[DONE]
 * - 2. Projection Logic.................................[DONE]
 * - 3. Nested Relational filters ??.....................[DONE]
 * - 4. Top Level Relational filters ....................TODO [V2]
 * - 5. Nested Object Lookup ............................TODO [V2]
 * - 6. Resolver for Meta Fields ........................TODO [V2]
 */

/**
 * AggregationController allows to construct
 * mongoDB pipeline stages from requested fields.
 * Example Usage:
 *    new AggregationController({
 *      typeName,
 *      info,
 *    }).constructQuery({ ....params })
 */
class AggregationController {
  #graphQLInfoMap;

  #controller;

  constructor({ typeName, info }) {
    this.typeName = typeName;
    this.#graphQLInfoMap = info;
    this.#controller = new AggregationBuilder(
      truncate(typeName, {
        length: 30,
        omission: '',
      }),
    );
  }

  // Extract pagination and filter params from requested fields.
  #getPaginationAndFilterParams = async ({
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

  #getFieldsArrBeingFetched = ({ fieldsRequestedForFetch, field }) => {
    const metaFields = [];
    const primitiveFields = [];
    const aliasFields = [];
    Object.keys(fieldsRequestedForFetch).forEach((fieldName) => {
      const fieldInfo = fieldsRequestedForFetch[fieldName];
      const fieldParams = field[fieldInfo.name];
      if (get(fieldParams, 'directive.relationalMeta')) {
        metaFields.push(fieldName);
      } else if (fieldInfo.name !== fieldInfo.alias) {
        aliasFields.push(fieldName);
      } else {
        primitiveFields.push(fieldName);
      }
    });
    return [...metaFields, ...aliasFields, ...primitiveFields];
  };

  #checkIfRelationalMetaFieldExists = ({
    fieldsRequestedForFetch,
    field,
  }) => Object.keys(fieldsRequestedForFetch).some((fieldName) => {
    const fieldInfo = fieldsRequestedForFetch[fieldName];
    const fieldParams = field[fieldInfo.name];
    if (get(fieldParams, 'directive.relationalMeta')) {
      return true;
    }
    return false;
  });

  // Add filters and pagination params to current aggregation instance.
  #buildPaginationStage = async ({
    params,
    typeName,
    aggregationBuilder,
    isList,
  }) => {
    let inputParams = params;
    if (!isList && !params.filter) {
      inputParams = { filter: params };
    }
    const {
      filter, limit, skip, sort,
    } = await this.#getPaginationAndFilterParams({
      inputParams,
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
   * Projecting fields in mongodb based on Type
   * @example_1 fieldName -> { id: '...' }
   *    OR { fieldName : [{....}] } [Relational List Field]
   * Output -> { fieldName: 1 }
   * @example_2 fieldName -> { fieldName: {...} } [Relational Object Field]
   * Output -> { fieldName: { $arrayElemAt: [$fieldName, 0] } }
   */
  #buildProjectionMapStage = ({
    builderInstance,
    fieldsRequestedForFetch,
    field,
  }) => {
    const aggregationBuilder = builderInstance;
    const projectionMap = {};

    this.#getFieldsArrBeingFetched({ fieldsRequestedForFetch, field })
      .forEach((fieldName) => {
        const fieldInfo = fieldsRequestedForFetch[fieldName];
        const fieldParams = field[fieldInfo.name];
        if (get(fieldParams, 'directive.relationalMeta')) {
          const relationalFieldName = fieldInfo.name.split(META)[0];
          projectionMap[fieldInfo.name] = 1;
          projectionMap[`${relationalFieldName}MetaDocument`] = 1;
        } else if (get(fieldParams, 'directive.relation')) {
          let aliasOrPrimitiveName = fieldInfo.name;
          if (fieldName !== fieldInfo.name) aliasOrPrimitiveName = fieldName;
          if (!get(fieldParams, 'type.isList', false)) {
            projectionMap[aliasOrPrimitiveName] = { $arrayElemAt: [`$${aliasOrPrimitiveName}`, 0] };
          } else {
            projectionMap[aliasOrPrimitiveName] = 1;
          }
        } else if (get(fieldParams, 'directive.defaultValue')) {
          let defaultFieldValue = get(fieldParams, 'directive.defaultValue.argument.value.value.value');
          if (get(fieldParams, 'type.dataType') === 'Boolean') defaultFieldValue = Boolean(defaultFieldValue);
          projectionMap[fieldInfo.name] = { $ifNull: [`$${fieldInfo.name}`, defaultFieldValue || ''] };
        } else { projectionMap[fieldInfo.name] = 1; }
      });

    // By Default project id field to ensure conditions do not fail in directive resolver.
    projectionMap.id = 1;

    if (projectionMap && Object.keys(projectionMap).length) {
      aggregationBuilder.Project(projectionMap);
    }
    return aggregationBuilder;
  };

  /**
   * Adding Lookup Stage based on nested pipeline
   * similar to performing joins in SQL.
   */
  #buildLookupStage = ({
    nestedPipeline,
    builderInstance,
    relationalTypeName,
    fieldName,
    fieldParams,
    alias,
  }) => {
    const nestedPipelineStages = nestedPipeline.getPipeline({
      allowEmpty: true,
    });

    if (nestedPipelineStages && nestedPipelineStages.length) {
      builderInstance.Lookup(
        ConditionPayload(relationalTypeName, alias || fieldName, {
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
          alias || fieldName,
          `${fieldName}.typeId`,
          'id',
        ),
      );
    }
    return builderInstance;
  };

  #buildAggregationPipeline = async ({
    parsedInfoMap,
    typeName,
    builderInstance,
    nestedInstance = false,
    isFieldList = null,
  }) => {
    let aggregationBuilder = builderInstance;
    if (aggregationBuilder && aggregationBuilder.getPipeline) {
      const { field } = parsedASTMap[typeName];
      const fieldsRequestedForFetch = parsedInfoMap.fieldsByTypeName[typeName];
      // Check if Filter Params exists for nested pipeline.
      if (nestedInstance && Object.keys(parsedInfoMap.args || {}).length) {
        aggregationBuilder = await this.#buildPaginationStage({
          params: parsedInfoMap.args || {},
          typeName,
          aggregationBuilder,
          isFieldList,
        });
      }

      if (this.#checkIfRelationalMetaFieldExists({ fieldsRequestedForFetch, field })) {
        const projectionMap = {};
        this.#getFieldsArrBeingFetched({ fieldsRequestedForFetch, field }).forEach((fieldName) => {
          const fieldInfo = fieldsRequestedForFetch[fieldName];
          const fieldParams = field[fieldInfo.name];
          if (get(fieldParams, 'directive.relationalMeta')) {
            const relationalFieldName = fieldInfo.name.split(META)[0];
            projectionMap[`${fieldInfo.name}Document`] = `$${relationalFieldName}`;
          }
          projectionMap[fieldInfo.name] = 1;
        });
        if (projectionMap && Object.keys(projectionMap).length) aggregationBuilder.Project(projectionMap);
      }

      // Loop through all the requested fields to build Lookup and Projection Stages.
      // eslint-disable-next-line no-restricted-syntax
      for (const fieldName of this.#getFieldsArrBeingFetched({ fieldsRequestedForFetch, field })) {
        const fieldInfo = fieldsRequestedForFetch[fieldName];
        const fieldParams = field[fieldInfo.name];
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
          const nestedBuilder = new AggregationBuilder(truncate(
            relationalTypeName, {
              length: 30,
              omission: '',
            },
          ));
          const nestedPipeline = await this.#buildAggregationPipeline({
            parsedInfoMap: parsedInfoMap
              ? parsedInfoMap.fieldsByTypeName[typeName][fieldName]
              : {},
            typeName: relationalTypeName,
            builderInstance: nestedBuilder,
            nestedInstance: true,
            isFieldList: get(fieldParams, 'type.isList', false),
          });

          // Build Lookup Stage to resolve required relational fields.
          aggregationBuilder = await this.#buildLookupStage({
            nestedPipeline,
            builderInstance: aggregationBuilder,
            relationalTypeName,
            fieldName: fieldInfo.name,
            fieldParams,
            alias: fieldName,
          });
        }
      }

      // Build Projection Stage to constraint required data from DB.
      aggregationBuilder = await this.#buildProjectionMapStage({
        builderInstance: aggregationBuilder,
        fieldsRequestedForFetch,
        field,
      });
    }
    return aggregationBuilder;
  };

  // This method is used get controller along with pipeline stages constructed.
  constructQuery = async (additionalParams = {}) => {
    const parsedInfoMap = parseGraphqlResolveInfo(this.#graphQLInfoMap);
    const typeName = this.typeName;
    if (checkIfDatabaseAggregationAllowedOnType({ typeName })) {
      const {
        filters = {}, limit = 0, skip = 0, sort = {},
      } = additionalParams;

      if (filters && Object.keys(filters).length) this.#controller.Match(filters);
      if (sort && Object.keys(sort).length) this.#controller.Sort(sort);
      if (skip) this.#controller.Skip(skip);
      if (limit) this.#controller.Limit(limit);

      this.#controller = await this.#buildAggregationPipeline({
        parsedInfoMap,
        typeName,
        builderInstance: this.#controller,
      });
    }
    return {
      controller: this.#controller,
      pipelineStages: this.#controller.getPipeline({ allowEmpty: true }),
      name: typeName,
    };
  };
}
export default AggregationController;
