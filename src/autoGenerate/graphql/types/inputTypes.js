import schemaTypes from './schemaTypes';
import getParsedASTMap from '../../utils/getParsedASTMap';
import {
  getFieldTypeString,
  appendAdditionalRelationFieldsToTypeObject,
  getSchemaStringFromSchemaMap } from './utils';
import { historyFieldName } from '../../../../constants';
import getDirectiveArgumentValue from '../../utils/getDirectiveArgumentValue';

const parsedASTMap = getParsedASTMap(schemaTypes);
// make a input types map of input and update type schema objects
// generated from types and their fields

let graphqlInputTypeObject = {};
const graphqlUpdateTypeObject = {};
let graphqlAdditionalRelationFieldsInputTypeObject = {};
let graphqlAdditionalRelationFieldsUpdateTypeObject = {};
const graphqlArrayTypeObject = {};
// Walk through AST map
Object.keys(parsedASTMap).forEach((type) => {
  const definition = parsedASTMap[type];
  const { name, field } = definition;
  const typeName = name.value;
  // Initialize type objects
  graphqlInputTypeObject[typeName] = graphqlInputTypeObject[typeName] || {};
  graphqlUpdateTypeObject[typeName] = graphqlUpdateTypeObject[typeName] || {};
  graphqlAdditionalRelationFieldsInputTypeObject[typeName] =
    graphqlAdditionalRelationFieldsInputTypeObject[typeName] || {};
  graphqlAdditionalRelationFieldsUpdateTypeObject[typeName] =
    graphqlAdditionalRelationFieldsUpdateTypeObject[typeName] || {};

  // Loop through each field of given type
  Object.keys(field).forEach((fieldName) => {
    const fieldDefinition = field[fieldName];
    const directivesObject = fieldDefinition.directive;

    const fieldType = fieldDefinition.type.dataType;
    const isRequiredField = fieldDefinition.type.isNonNull;
    const isFieldList = fieldDefinition.type.isList;
    const isRelationField = directivesObject && directivesObject.relation;
    const isRelationalMetaField = directivesObject && directivesObject.relationalMeta;
    const isObjectTypeField = parsedASTMap[fieldType];

    const hasDefaultDirective = directivesObject && directivesObject.defaultValue;
    const hasAutoDirective = directivesObject && directivesObject.auto;
    const additionalRelationFields = getDirectiveArgumentValue(parsedASTMap, typeName,
      fieldName, 'relation', 'fields');
    const isAdditionalField = directivesObject && directivesObject.isRelationField;
    // have Additional fields
    let haveAdditionalFields = false;
    // if readonly or id or an additionalField dont add to input type
    if (fieldName === 'id' || isAdditionalField || isRelationalMetaField) {
      return;
    }
    if (fieldName === historyFieldName) {
      return;
    }
    // Fill input type strings
    let isUpdateType = false;
    const fieldInputTypeString = getFieldTypeString(fieldName, fieldType, isFieldList,
      isObjectTypeField, isRelationField, isRequiredField, hasDefaultDirective, hasAutoDirective,
      isUpdateType, haveAdditionalFields);
    // Fill update type strings
    isUpdateType = true;
    const fieldUpdateTypeString = getFieldTypeString(fieldName, fieldType, isFieldList,
      isObjectTypeField, isRelationField, isRequiredField,
      hasDefaultDirective, hasAutoDirective, isUpdateType, haveAdditionalFields,
      graphqlArrayTypeObject);
    // add field schema to input type object
    graphqlInputTypeObject[typeName][fieldName] = fieldInputTypeString;
    graphqlUpdateTypeObject[typeName][fieldName] = fieldUpdateTypeString;
    // if relation field, check for additional fields and add them.
    if (additionalRelationFields) {
      haveAdditionalFields = true;
      const relationName = getDirectiveArgumentValue(parsedASTMap, typeName,
        fieldName, 'relation', 'name');
      graphqlInputTypeObject = appendAdditionalRelationFieldsToTypeObject(additionalRelationFields,
        graphqlInputTypeObject, fieldType, relationName, parsedASTMap, fieldType, false,
        graphqlArrayTypeObject);
      const additionalTypeName = `${typeName}_${relationName}`;
      graphqlAdditionalRelationFieldsInputTypeObject = appendAdditionalRelationFieldsToTypeObject(
        additionalRelationFields, graphqlAdditionalRelationFieldsInputTypeObject,
        fieldType, relationName, parsedASTMap, additionalTypeName, false, graphqlArrayTypeObject);
      graphqlAdditionalRelationFieldsUpdateTypeObject = appendAdditionalRelationFieldsToTypeObject(
        additionalRelationFields, graphqlAdditionalRelationFieldsUpdateTypeObject,
        fieldType, relationName, parsedASTMap, additionalTypeName, true, graphqlArrayTypeObject);
      // Add additionalFields Update fields
      const additionalFieldName = `${fieldName}_AdditionalFields`;

      // additionalFieldType is not a List
      const isAdditionalFieldTypeList = false;
      const additionalFieldUpdateTypeString = getFieldTypeString(additionalFieldName,
        `${typeName}_${relationName}`, isAdditionalFieldTypeList,
        isObjectTypeField, false, isRequiredField,
        hasDefaultDirective, hasAutoDirective, isUpdateType, haveAdditionalFields,
        graphqlArrayTypeObject);
      graphqlUpdateTypeObject[typeName][additionalFieldName] =
        additionalFieldUpdateTypeString;
    }
  });
});
// get schema strings from input schema maps
const inputTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlInputTypeObject, 'Input');
const updateTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlUpdateTypeObject, 'Update');
const updateAllTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlUpdateTypeObject, 'UpdateAll');
const additionalRelationFieldsTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlAdditionalRelationFieldsInputTypeObject, 'Input');
const additionalRelationFieldsUpdateTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlAdditionalRelationFieldsUpdateTypeObject, 'Update');
const arrayTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlArrayTypeObject, 'ArrayUpdate');
// remove nulls from input types array
const inputTypesArray = [
  ...inputTypesSchemaArray,
  ...updateTypesSchemaArray,
  ...updateAllTypesSchemaArray,
  ...additionalRelationFieldsTypesSchemaArray,
  ...additionalRelationFieldsUpdateTypesSchemaArray, ...arrayTypesSchemaArray];

export default inputTypesArray;
