/* file for autogenerating queries from schema types */

import pluralize from 'pluralize';
import { camelCase, trimEnd, includes } from 'lodash';
import { getParsedASTMap } from '../utils';
import getEnumDefinitionTypeObject from '../utils/getEnumDefinitionTypeObject';

import { types } from '../../../utils';
import { scalarTypes, sortBy, allFilters, META } from '../../../constants';
import { InvalidFieldType } from '../../../constants/errors';
import hasDirective from '../utils/hasDirective';
import visitField from '../utils/visitField';
import { PLURAL, SINGULAR, META_QUERY } from '../../../constants/graphqlOperations';

const parsedASTMap = getParsedASTMap(types);
const parsedASTTypes = Object.keys(parsedASTMap);
const parsedEnumMap = getEnumDefinitionTypeObject(types);
const parsedEnumTypes = Object.keys(parsedEnumMap);
// array for all filter types for querying
const filterTypes = [];
// array for all groupBY types for querying
const groupByTypes = [];
// array for all types with relation field filters
const typesWithRelationFilters = types.slice();
// filter name
const getFilterName = typeName => `${typeName}Filter`;
// group by name
const getGroupByName = typeName => `${typeName}GroupBy`;

// adding the _asc and _desc to the modal colections to the scalar types field only
const getSortFields = (field, typeASTFields) => {
  let fieldSort = '';
  const fieldName = typeASTFields[field];
  const fieldType = fieldName.type.dataType;
  // adding field filter for scalar types
  if (includes(scalarTypes, fieldType)) {
    fieldSort += `${field}_${sortBy[0]},`;
    fieldSort += `${field}_${sortBy[1]},`;
  }
  return fieldSort;
};

// get sorted string with the enum schema
const sortString = () => {
  let sortQueryString = '';
  Object.keys(parsedASTMap).forEach((collection) => {
    const typeDirectives = parsedASTMap[collection].directives;
    if (hasDirective(typeDirectives, 'model') || hasDirective(typeDirectives, 'historyModel')) {
      const typeASTFields = parsedASTMap[collection].field;
      sortQueryString += `enum Sort${collection} {`;
      Object.keys(typeASTFields).forEach((fieldName) => {
        sortQueryString += getSortFields(fieldName, typeASTFields);
      });
      sortQueryString = sortQueryString.substring(0, sortQueryString.length - 1);
      sortQueryString += '}';
    }
  });
  return sortQueryString;
};

const generateFieldFilterForScalarTypes = (fieldName, fieldType, isFieldListType) => {
  let fieldFilter = '';
  /* eslint-disable no-fallthrough */
  switch (fieldType) {
    case 'Boolean': {
      fieldFilter += `${fieldName}: ${fieldType},`;
      fieldFilter += `${fieldName}_${allFilters.not}: ${fieldType},`;
      fieldFilter += (fieldName !== 'this') ? `${fieldName}_${allFilters.exists}: Boolean,` : '';
      break;
    }
    case 'Int': {
      // do same as float
    }
    case 'Float': {
      fieldFilter += `${fieldName}: ${fieldType},`;
      fieldFilter += `${fieldName}_${allFilters.not}: ${fieldType},`;
      fieldFilter += `${fieldName}_${allFilters.in}: [${fieldType}],`;
      fieldFilter += `${fieldName}_${allFilters.notIn}: [${fieldType}],`;
      fieldFilter += `${fieldName}_${allFilters.lt}: ${fieldType},`;
      // fieldFilter += `${fieldName}_${allFilters.lte}: ${fieldType},`;
      fieldFilter += `${fieldName}_${allFilters.gt}: ${fieldType},`;
      // fieldFilter += `${fieldName}_${allFilters.gte}: ${fieldType},`;
      fieldFilter += (fieldName !== 'this') ? `${fieldName}_${allFilters.exists}: Boolean,` : '';
      if (isFieldListType) {
        fieldFilter += `${fieldName}_${allFilters.array}: [${fieldType}]`;
        fieldFilter += `${fieldName}_${allFilters.notArray}: [${fieldType}]`;
      }
      break;
    }

    case 'ID': {
      fieldFilter += `${fieldName}: ${fieldType},`;
      fieldFilter += `${fieldName}_${allFilters.not}: ${fieldType},`;
      fieldFilter += `${fieldName}_${allFilters.in}: [${fieldType}],`;
      fieldFilter += `${fieldName}_${allFilters.notIn}: [${fieldType}],`;
      break;
    }
    case 'String': {
      fieldFilter += `${fieldName}: ${fieldType},`;
      fieldFilter += `${fieldName}_${allFilters.not}: ${fieldType},`;
      fieldFilter += `${fieldName}_${allFilters.in}: [${fieldType}],`;
      fieldFilter += `${fieldName}_${allFilters.notIn}: [${fieldType}],`;
      fieldFilter += `${fieldName}_${allFilters.contains}: ${fieldType},`;
      fieldFilter += `${fieldName}_${allFilters.notContains}: ${fieldType},`;
      fieldFilter += (fieldName !== 'this') ? `${fieldName}_${allFilters.exists}: Boolean,` : '';
      fieldFilter += `${fieldName}_${allFilters.startsWith}: ${fieldType},`;
      // fieldFilter += `${fieldName}_${allFilters.notStartsWith}: ${fieldType},`;
      // fieldFilter += `${fieldName}_${allFilters.endsWith}: ${fieldType},`;
      // fieldFilter += `${fieldName}_${allFilters.notEndsWith}: ${fieldType},`;
      if (isFieldListType) {
        fieldFilter += `${fieldName}_${allFilters.array}: [${fieldType}]`;
        fieldFilter += `${fieldName}_${allFilters.notArray}: [${fieldType}]`;
      }
      break;
    }
    case 'Date': {
      fieldFilter += `${fieldName}: ${fieldType},`;
      fieldFilter += `${fieldName}_${allFilters.not}: ${fieldType},`;
      fieldFilter += `${fieldName}_${allFilters.in}: [${fieldType}],`;
      fieldFilter += `${fieldName}_${allFilters.notIn}: [${fieldType}],`;
      fieldFilter += `${fieldName}_${allFilters.gt}: ${fieldType},`;
      fieldFilter += `${fieldName}_${allFilters.lt}: ${fieldType},`;
      fieldFilter += (fieldName !== 'this') ? `${fieldName}_${allFilters.exists}: Boolean,` : '';
      break;
    }

    /* no default */
  }
  return fieldFilter;
};

const generateFieldFilterForEnumTypes = (fieldName, fieldType, isFieldListType) => {
  let fieldFilter = '';
  fieldFilter += `${fieldName}: ${fieldType},`;
  fieldFilter += `${fieldName}_${allFilters.not}: ${fieldType},`;
  fieldFilter += `${fieldName}_${allFilters.in}: [${fieldType}],`;
  fieldFilter += `${fieldName}_${allFilters.notIn}: [${fieldType}],`;
  fieldFilter += (fieldName !== 'this') ? `${fieldName}_${allFilters.exists}: Boolean,` : '';
  if (isFieldListType) {
    fieldFilter += `${fieldName}_${allFilters.array}: [${fieldType}]`;
    fieldFilter += `${fieldName}_${allFilters.notArray}: [${fieldType}]`;
  }
  return fieldFilter;
};

const getFieldFilters = (fieldName, typeASTFields) => {
  let fieldFilter = '';
  let field;

  if (includes(fieldName, 'subDoc')) {
    // since subdoc is in the last so splitting will give subDocFields and subDoc in the end
    const splitFields = fieldName.split('_');
    // from lastSubDocField I can get the dataType
    const lastsubDocField = splitFields[splitFields.length - 2];
    field = typeASTFields[lastsubDocField];
    const fieldType = field.type.dataType;
    const isFielListType = field.type.isList;
    // adding field filter for scalar types
    if (includes(scalarTypes, fieldType)) {
      fieldFilter += generateFieldFilterForScalarTypes(fieldName, fieldType, isFielListType);
    } else if (includes(parsedEnumTypes, fieldType)) {
      fieldFilter += generateFieldFilterForEnumTypes(fieldName, fieldType, isFielListType);
    } else if (includes(parsedASTTypes, fieldType)) {
      // handled later
    } else {
      throw new InvalidFieldType();
    }
  } else {
    field = typeASTFields[fieldName];
    const fieldType = field.type.dataType;
    const isFielListType = field.type.isList;
    // adding field filter for scalar types
    if (includes(scalarTypes, fieldType)) {
      fieldFilter += generateFieldFilterForScalarTypes(fieldName, fieldType);
      // adding filters for relations
    } else if (includes(parsedASTTypes, fieldType)) {
      // TODO: cases for is model or not && is related field or embedded field
      const typeDirectives = parsedASTMap[fieldType].directives;
      if (hasDirective(typeDirectives, 'model') || hasDirective(typeDirectives, 'historyModel')) {
        const relatedFieldFilterName = getFilterName(fieldType);
        fieldFilter += `${fieldName}_${allFilters.none}: ${relatedFieldFilterName},`;
        fieldFilter += `${fieldName}_${allFilters.some}: ${relatedFieldFilterName},`;
        fieldFilter += `${fieldName}_${allFilters.exists}: Boolean,`;
        // for nested update in case of updateWhere and all
        fieldFilter += `${fieldName}${allFilters.referenceId}: ID,`;
      }
    } else if (includes(parsedEnumTypes, fieldType)) {
      fieldFilter += generateFieldFilterForEnumTypes(fieldName, fieldType, isFielListType);
    } else {
      throw new InvalidFieldType();
    }
  }

  return fieldFilter;
};


const getAllFieldsToBeFiltered = (collection, completeFields, parentName) => {
  const typeAST = parsedASTMap[collection];

  // get fields for current collection which can either be main doc or can be subdoc
  const typeASTFields = typeAST && typeAST.field;

  if (typeASTFields && Object.keys(typeASTFields).length) {
    Object.keys(typeASTFields).forEach((individualField) => {
      let parentJoins = '';
      const dataType = typeASTFields[individualField].type.dataType;
      // if not filter directive then dont add field filter
      const isFilteringOffForField = typeASTFields[individualField].directive &&
        typeASTFields[individualField].directive.filterOff;
      if (isFilteringOffForField) {
        return;
      }
      // if parentName exists then the filter is for subdoc
      if (parentName) {
        /* parentJoins contain previous field information and the dataType of the current
        field separated by ::
        */
        parentJoins = `${parentName.split('::')[0]}_${individualField}::${collection}`;
        completeFields.push(parentJoins);
      } else {
        parentJoins = individualField;
        completeFields.push(individualField);
      }
      // recursively call if the field type has subdocument
      if (
        !includes(scalarTypes, dataType)
        && parsedASTMap[dataType]
        && !parsedASTMap[dataType].directives.length
      ) {
        getAllFieldsToBeFiltered(dataType, completeFields, parentJoins);
      }
    });
  }
  return completeFields;
};

const getAllGroupByFields = (collection) => {
  const typeAST = parsedASTMap[collection];
  const typeASTFields = typeAST && typeAST.field;
  let groupByFields = '';

  if (typeASTFields && Object.keys(typeASTFields).length) {
    Object.keys(typeASTFields)
      .forEach((individualField) => {
        const isGroupByField = typeASTFields[individualField].directive &&
          typeASTFields[individualField].directive.groupBy;
        if (isGroupByField) {
          groupByFields += `${individualField} ,`;
        }
      });
  }
  return groupByFields;
};
const createGroupByType = (typeName) => {
  const typeASTFieldsName = getAllGroupByFields(typeName);
  let groupByString;
  if (typeASTFieldsName) {
    const groupByName = getGroupByName(typeName);
    groupByString = `enum ${groupByName}{`;
    groupByString += trimEnd(typeASTFieldsName, ',');
    groupByString += '}';
  }
  return groupByString;
};

// Create filter types for model and object types
const createFilterType = (typeName) => {
  const filterName = getFilterName(typeName);
  let filterTypeString = `input ${filterName}{`;
  //  add AND n OR filters
  filterTypeString += `${allFilters.and}: [${filterName}], ${allFilters.or}: [${filterName}],`;
  filterTypeString += `${allFilters.AND}: [${filterName}], ${allFilters.OR}: [${filterName}],`;

  // get all fields including fields of subdoc of the current typeName
  const completeFields = [];
  const parentName = '';
  const typeASTFieldsName = getAllFieldsToBeFiltered(typeName, completeFields, parentName);
  typeASTFieldsName.forEach((fieldName) => {
    // if :: is present then this is the case of subdoc
    if (includes(fieldName, '::')) {
      // splitField will contain fields on 0th index and datatype on the first
      const splitField = fieldName.split('::');
      const collectionName = splitField[1];
      // appending subDoc to exclusively recognise this field
      const allSubDocFields = `${splitField[0]}_subDoc`;
      const typeASTFields = parsedASTMap[collectionName].field;
      filterTypeString += getFieldFilters(allSubDocFields, typeASTFields);
    } else {
      const typeASTFields = parsedASTMap[typeName].field;
      filterTypeString += getFieldFilters(fieldName, typeASTFields);
    }
  });
  filterTypeString = trimEnd(filterTypeString, ',');
  filterTypeString += '}';
  return filterTypeString;
};

// Create filter types for enums
const createEnumFilters = () => {
  parsedEnumTypes.forEach((typeName) => {
    const filterName = getFilterName(typeName);
    let filterTypeString = `input ${filterName}{`;
    //  add AND n OR filters
    filterTypeString += `${allFilters.and}: [${filterName}], ${allFilters.or}: [${filterName}],`;
    filterTypeString += `${allFilters.AND}: [${filterName}], ${allFilters.OR}: [${filterName}],`;
    // add rest filters
    filterTypeString += generateFieldFilterForEnumTypes('this', typeName);
    filterTypeString = trimEnd(filterTypeString, ',');
    filterTypeString += '}';
    filterTypes.push(filterTypeString);
  });
};

// Create filter types for default scalars
const createScalarFilters = () => {
  scalarTypes.forEach((scalarType) => {
    const filterName = getFilterName(scalarType);
    let filterTypeString = `input ${filterName}{`;
    //  add AND n OR filters
    filterTypeString += `${allFilters.and}: [${filterName}], ${allFilters.or}: [${filterName}],`;
    filterTypeString += `${allFilters.AND}: [${filterName}], ${allFilters.OR}: [${filterName}],`;
    // add rest filters
    filterTypeString += generateFieldFilterForScalarTypes('this', scalarType);
    filterTypeString = trimEnd(filterTypeString, ',');
    filterTypeString += '}';
    filterTypes.push(filterTypeString);
  });
};

let queryString = 'type Query{';

// Fill fetchParamsString - unique fields to be used as filter
const fetchParamsString = {};

parsedASTTypes.forEach((type) => {
  const definition = parsedASTMap[type];
  const { field } = definition;
  let singleFetchParamsString = 'id: ID,';
  const fieldNamesArray = Object.keys(field);
  // model fields parse
  if (fieldNamesArray && fieldNamesArray.length) {
    fieldNamesArray.forEach((fieldName) => {
      const fieldDefinition = field[fieldName];
      const fieldObject = visitField(fieldDefinition, parsedASTMap, type);
      if (fieldObject) {
        const { singleFetchFieldParams } = fieldObject;
        // append to params string
        singleFetchParamsString += singleFetchFieldParams;
      }
    });
  }
  fetchParamsString[type] = singleFetchParamsString;
});

parsedASTTypes.forEach((type) => {
  const definition = parsedASTMap[type];
  const { name, field, directives, relationFields, allowedOperations } = definition;
  const typeName = name.value;
  // query
  const modelSingular = camelCase(typeName);
  const modelPlural = camelCase(pluralize(typeName));

  const isModel = directives && hasDirective(directives, 'model');
  // Create filter type for all object types
  const filterType = createFilterType(typeName);
  filterTypes.push(filterType);
  // query
  if (isModel) {
    const filterName = getFilterName(typeName);
    const groupByName = getGroupByName(typeName);
    const groupByType = createGroupByType(typeName);
    if (groupByType) {
      groupByTypes.push(groupByType);
    }
    // Get unique fields filters
    let singleFetchParamsString = fetchParamsString[type];
    singleFetchParamsString = trimEnd(singleFetchParamsString, ',');


    if (
      (allowedOperations && allowedOperations === '*') ||
    (allowedOperations && allowedOperations !== '*' &&
        allowedOperations.length && allowedOperations.includes(SINGULAR))
    ) {
      queryString += `${modelSingular}(${singleFetchParamsString}): ${typeName},`;
    }

    if (
      (allowedOperations && allowedOperations === '*') ||
        (allowedOperations && allowedOperations !== '*' &&
            allowedOperations.length && allowedOperations.includes(PLURAL))
    ) {
      queryString += `${modelPlural}(filter : ${filterName}, orderBy:Sort${typeName}, last: Int, first:Int, skip:Int, after: ID, before:ID) : [${typeName}],`;
    }

    if (
      (allowedOperations && allowedOperations === '*') ||
        (allowedOperations && allowedOperations !== '*' &&
            allowedOperations.length && allowedOperations.includes(META_QUERY))
    ) {
      if (!groupByType) {
        queryString += `${modelPlural}${META}(filter : ${filterName}) : AggregationResult,`;
      } else {
        queryString += `${modelPlural}${META}(filter : ${filterName}, groupBy : ${groupByName}) : AggregationResult,`;
      }
    }
    // Fill schema types with filters on relations
    const modelTypeIndex = typesWithRelationFilters.findIndex(typeString => typeString.includes(`type ${type} @model`));
    if (relationFields && Object.keys(relationFields).length) {
      const relationKeys = Object.keys(relationFields);
      relationKeys.forEach((relationKey) => {
        const isArray = field[relationKey].type.isList;
        // Model typeDef string from types schemas
        const modelString = typesWithRelationFilters[modelTypeIndex];
        // Find relation value where filters to be applied
        // from filterKeyName to @ of relation directive
        let findValue = '';
        const findIndex = modelString.indexOf(`${relationKey}:`);
        for (let i = findIndex; i < modelString.length; i += 1) {
          if (modelString[i] === '@') {
            break;
          }
          findValue += modelString[i];
        }
        // Replaced value with autogenerated filters for relations
        let replaceValue = '';
        const finalRelationKey = field[relationKey].type.dataType;
        const relationFilterName = getFilterName(finalRelationKey);
        const relationFilterType = createFilterType(finalRelationKey);
        filterTypes.push(relationFilterType);
        if (isArray) {
          replaceValue += `${relationKey}(filter : ${relationFilterName}, orderBy:Sort${finalRelationKey}, last: Int, first:Int, skip:Int, after: ID, before:ID ) : [${finalRelationKey}] `;
        } else {
          singleFetchParamsString = fetchParamsString[finalRelationKey];
          singleFetchParamsString = trimEnd(singleFetchParamsString, ',');
          replaceValue += `${relationKey}(${singleFetchParamsString}): ${finalRelationKey} `;
        }
        replaceValue = trimEnd(replaceValue, ',');
        // Replace filter on relations
        typesWithRelationFilters[modelTypeIndex]
          = typesWithRelationFilters[modelTypeIndex].replace(findValue, replaceValue);
      });
    }
  }
});

queryString += 'me: User,';

queryString = trimEnd(queryString, ',');
queryString += '}';
const query = queryString;
const sort = sortString();

// Create scalar filterTypes
createScalarFilters();
// Create enum filterTypes
createEnumFilters();

export { query, filterTypes, sort, typesWithRelationFilters, groupByTypes };
