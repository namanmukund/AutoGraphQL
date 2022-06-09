/* eslint-disable no-await-in-loop */
import { AggregationBuilder } from 'mongodb-aggregation-builder';
import { ConditionPayload, EqualityPayload } from 'mongodb-aggregation-builder/helpers';
import { get, truncate } from 'lodash';
import { getTypeDirectiveArgumentValue } from '../../utils/getDirectiveArgumentValue';
import { META, dbControllerModes, FORCE_DB_AGGREGATION_MODE } from '../../../../constants';
import { getParsedASTMap } from '../../utils';
import { types } from '../../../../utils';
import parseGraphqlResolveInfo from '../../../../utils/parseGraphqlResolveInfo';
import getPaginationAndFilterParams from './utils/getPaginationAndFilterParams';

const parsedASTMap = getParsedASTMap(types);

// Allow Aggregation if databaseController directive
// exists on Type with mode as aggregation.
export const checkIfDatabaseAggregationAllowedOnType = ({ typeName }) => {
  if (FORCE_DB_AGGREGATION_MODE) return true;
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
 * Aggregation Controller Roadmap:
 * - 1. Directive Based Condition to check if aggregation is allowed........[DONE]
 * - 2. Nested Lookup Builder for Relational Fields.........................[DONE]
 * - 2. Projection Stage to select required fields..........................[DONE]
 * - 3. Cascade Relational filters Match Stage V1...........................[DONE]
 * - 4. Aggregated Relational filters.......................................[TODO V2]
 * - 5. Nested Object/Array Relational Lookup...............................[TODO V2]
 * - 6. Meta Field with filters resolver....................................[TODO V2]
 */

/**
 * AggregationController allows to construct mongoDB
 * pipeline stages from requested fields.
 * Example Usage:
 *    new AggregationController({
 *      typeName,
 *      info,
 *    }).constructQuery({ ....params })
 */
class AggregationController {
  // Note: `#` Represents private variables and methods.

  /**
   * GraphQL's prop which contains info about requested fields
   * like Directives, Datatype (TypeName), Array or Object, nested fields.
   * */
  #graphQLInfoMap;

  // Root AggregationBuilder Instance.
  #controller;

  constructor({ typeName, info }) {
    this.typeName = typeName;
    this.#graphQLInfoMap = info;
    this.#controller = new AggregationBuilder(
      // Aggregation Name ~ Accepts only 30 chars.
      truncate(typeName, {
        length: 30,
        omission: '',
      }),
    );
  }

  /**
   * Get Array of fieldNames from requested graphQL query.
   * Example:
   *  Input:
   *    fieldsRequestedForFetch = {
          coursesMeta: { name: "coursesMeta", alias: "coursesMeta" },
          id: { name: "id", alias: "id" },
          topicTitle: { name: "title", alias: "topicTitle" },
        }
   *  Output: ['coursesMeta', 'topicTitle', 'id']
   */
  #getRequestedGraphQLFieldsArray = ({
    fieldsRequestedForFetch,
    field: fieldsInfoMap,
  }) => {
    // Example: couresMeta, topicsMeta....
    const metaFields = [];
    // Example: id, title....
    const primitiveFields = [];
    // Example: title renamed as topicTitle i.e topic { topicTitle: title }
    const aliasFields = [];
    Object.keys(fieldsRequestedForFetch).forEach((fieldName) => {
      const fieldInfo = fieldsRequestedForFetch[fieldName];
      const fieldParams = fieldsInfoMap[fieldInfo.name];
      if (get(fieldParams, 'directive.relationalMeta')) {
        metaFields.push(fieldName);
      } else if (fieldInfo.name !== fieldInfo.alias) {
        aliasFields.push(fieldName);
      } else {
        primitiveFields.push(fieldName);
      }
    });
    // Returning fields Array as per precedence.
    // Example: ['coursesMeta', 'topicTitle', 'id']
    return [...metaFields, ...aliasFields, ...primitiveFields];
  };

  // For Requeseted Field check if it is Relational Meta.
  #checkIfRelationalMetaFieldExists = ({ fieldsRequestedForFetch, field }) => Object.keys(fieldsRequestedForFetch).some((fieldName) => {
    const fieldInfo = fieldsRequestedForFetch[fieldName];
    const fieldParams = field[fieldInfo.name];
    if (get(fieldParams, 'directive.relationalMeta')) {
      return true;
    }
    return false;
  });

  // Add filters and pagination params to current aggregation instance.
  #buildMatchAndPaginationStage = async ({
    params,
    typeName,
    aggregationBuilder,
    isList,
  }) => {
    let inputParams = params;
    // Wrap filter param if field is not List and does not include filter param.
    if (!isList && params && !params.filter) {
      inputParams = { filter: params };
    }
    const {
      filter, limit, skip, sort,
    } = await getPaginationAndFilterParams({
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
   * @example_1 -
   *  { id  }
   *    OR
   *  { courses: [{...}] } [Relational List Field]
   * Output -> { id: 1 } OR { courses: 1 }
   * @example_2 -
   * { chapter: { id } } [Relational Object Field]
   * Output -> { chapter: { $arrayElemAt: [$chapter, 0] } }
   */
  #buildProjectionMapStage = ({
    builderInstance,
    fieldsRequestedForFetch,
    field,
  }) => {
    const aggregationBuilder = builderInstance;
    const projectionMap = {};

    // Looping through all the requested fields and appending it to projection stage.
    this.#getRequestedGraphQLFieldsArray({
      fieldsRequestedForFetch,
      field,
    }).forEach((fieldName) => {
      const fieldInfo = fieldsRequestedForFetch[fieldName];
      const fieldParams = field[fieldInfo.name];
      if (get(fieldParams, 'directive.relationalMeta')) {
        // const relationalFieldName = fieldInfo.name.split(META)[0];
        projectionMap[fieldInfo.name] = 1;
        // In Meta Field we also proejct `${fieldInfo.name}_DocumentForMeta`
        // as this custom field contains all the result data from DB
        // without any filters or pagination.
        projectionMap[`${fieldInfo.name}_DocumentForMeta`] = 1;
      } else if (get(fieldParams, 'directive.relation')) {
        let aliasOrPrimitiveName = fieldInfo.name;
        // If requested field is renamed then project that renamed field only.
        if (fieldName !== fieldInfo.name) aliasOrPrimitiveName = fieldName;
        // As lookup always results in array if field is not array
        // then pick resulting data from 1st position.
        if (!get(fieldParams, 'type.isList', false)) {
          projectionMap[aliasOrPrimitiveName] = {
            $arrayElemAt: [`$${aliasOrPrimitiveName}`, 0],
          };
        } else {
          projectionMap[aliasOrPrimitiveName] = 1;
        }
      } else if (get(fieldParams, 'directive.defaultValue')) {
        // DefautValue directive only works with mongoose so
        // here we are manually assigned default value if not found in DB.
        let defaultFieldValue = get(
          fieldParams,
          'directive.defaultValue.argument.value.value.value',
        );
        if (get(fieldParams, 'type.dataType') === 'Boolean') {
          defaultFieldValue = Boolean(defaultFieldValue);
        }
        projectionMap[fieldInfo.name] = {
          $ifNull: [`$${fieldInfo.name}`, defaultFieldValue || ''],
        };
      } else {
        projectionMap[fieldInfo.name] = 1;
      }
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
   * Example:
   *  Requested Fields {
   *    topics { title chapter { title } } }
   * Output:
   *  {
   *    from: 'Topic',
   *    let: { topicsId: '$topics.typeId' }
   *    as: 'topics',
   *    pipeline: [
   *      { $match: { $expr: { $in: ['$id', '$$topicsId'] } } },
   *      { $lookup: {
   *          from: 'Chapter',
   *          let: { chapterId: '$chapter.typeId' },
   *          as: 'chapter',
   *          pipeline: [
   *            { $match: { $expr: { $eq: ['$id', '$$chapterId' ] } } }
   *            { $project: { title: 1 } }
   *          ]
   *        }
   *      },
   *      { $project: { title: 1, chapter: 1 } },
   *    ]
   *  }
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
      // ConditionPayload is used when lookup has some nested relational fields.
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
      // EqualityPayload is a simple lookup without any nested fields.
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

  // Root Method for building pipelineStages (with nesting).
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
        aggregationBuilder = await this.#buildMatchAndPaginationStage({
          params: parsedInfoMap.args || {},
          typeName,
          aggregationBuilder,
          isFieldList,
        });
      }

      // If Any Relational Meta Field Exists then add Initial Project Stage.
      if (
        this.#checkIfRelationalMetaFieldExists({
          fieldsRequestedForFetch,
          field,
        })
      ) {
        const projectionMap = {};
        this.#getRequestedGraphQLFieldsArray({
          fieldsRequestedForFetch,
          field,
        }).forEach((fieldName) => {
          const fieldInfo = fieldsRequestedForFetch[fieldName];
          const fieldParams = field[fieldInfo.name];
          if (get(fieldParams, 'directive.relationalMeta')) {
            const relationalFieldName = fieldInfo.name.split(META)[0];
            // Assigning corresponding relational field to custom variables
            // this helps us in total meta count for relationalMeta field
            // if no filters are applied to meta field.
            // Example:
            // Requested Fields - topics { coursesMeta { count } }
            // then we will assign courses data to courses_DocumentForMeta
            // this field is then used in commonFunctionForRelationAndMeta.js
            projectionMap[
              `${fieldInfo.name}_DocumentForMeta`
            ] = `$${relationalFieldName}`;
          }
          projectionMap[fieldInfo.name] = 1;
        });
        if (projectionMap && Object.keys(projectionMap).length) {
          aggregationBuilder.Project(projectionMap);
        }
      }

      // Loop through all the requested fields to build Lookup and Projection Stages.
      // eslint-disable-next-line no-restricted-syntax
      for (const fieldName of this.#getRequestedGraphQLFieldsArray({
        fieldsRequestedForFetch,
        field,
      })) {
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
          const nestedBuilder = new AggregationBuilder(
            truncate(relationalTypeName, {
              length: 30,
              omission: '',
            }),
          );
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

      // Build Projection Stage to constraint/select required data from DB.
      aggregationBuilder = await this.#buildProjectionMapStage({
        builderInstance: aggregationBuilder,
        fieldsRequestedForFetch,
        field,
      });
    }
    return aggregationBuilder;
  };

  // This method is used get controller along with constructed pipeline stages.
  constructQuery = async (additionalParams = {}) => {
    const parsedInfoMap = parseGraphqlResolveInfo(this.#graphQLInfoMap);
    const typeName = this.typeName;
    if (checkIfDatabaseAggregationAllowedOnType({ typeName })) {
      // Adding root filters and pagination supplied to query.
      // Example: { topics(filter:{ status: published }, first: 10, skip: 0) }
      const {
        filters = {}, limit = 0, skip = 0, sort = {},
      } = additionalParams;

      if (filters && Object.keys(filters).length) {
        this.#controller.Match(filters);
      }
      if (sort && Object.keys(sort).length) this.#controller.Sort(sort);
      if (skip) this.#controller.Skip(skip);
      if (limit) this.#controller.Limit(limit);

      // Now build Nested Pipeline with different stages i.e. Lookup & Projection.
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
