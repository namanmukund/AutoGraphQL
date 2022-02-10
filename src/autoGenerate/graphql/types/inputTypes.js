import { indexOf } from 'lodash';
import schemaTypes from './schemaTypes';
import getParsedASTMap from '../../utils/getParsedASTMap';
import {
  getFieldTypeString,
  appendAdditionalRelationFieldsToTypeObject,
  getSchemaStringFromSchemaMap, getFileUploadEnumType,
} from './utils';
import { connectMutationsArgumentsSuffix, historyFieldName, scalarTypes } from '../../../../constants';
import getDirectiveArgumentValue from '../../utils/getDirectiveArgumentValue';
import hasDirective from '../../utils/hasDirective';
import getNestedConnectMutationString from '../../utils/getNestedConnectMutationString';
import { UnsupportedListFieldInsideSubDocumentObjectError } from '../../../../constants/errors/types';

const parsedASTMap = getParsedASTMap(schemaTypes);
// make a input types map of input and update type schema objects
// generated from types and their fields

let graphqlInputTypeObject = {};
const graphqlScalarTypeObject = {};
const graphqlUpdateTypeObject = {};
const graphqlUpdateAllTypeObject = {};
let graphqlAdditionalRelationFieldsInputTypeObject = {};
let graphqlAdditionalRelationFieldsUpdateTypeObject = {};
const graphqlArrayTypeObject = {};
const nestedConnectMutationStringObject = {};
// Enum types for uploadFile
const fileConnectedTypeEnumArray = [];
const fileConnectedTypeFieldEnumArray = [];
// Walk through AST map
Object.keys(parsedASTMap).forEach((type) => {
  const definition = parsedASTMap[type];
  const { name, field, directives } = definition;
  const isModel = directives && hasDirective(directives, 'model');
  if (isModel) {
    // generate nestedConnectMutationStringObject to be made available for updateAll connect purpose
    const { relationFields } = definition;
    const nestedConnectMutationString = getNestedConnectMutationString(
      relationFields,
      type,
      parsedASTMap,
    );
    nestedConnectMutationStringObject[type] = nestedConnectMutationString;
  }
  const typeName = name.value;
  // for generating connect type data
  // Initialize type objects
  graphqlInputTypeObject[typeName] = graphqlInputTypeObject[typeName] || {};
  graphqlScalarTypeObject[typeName] = graphqlScalarTypeObject[typeName] || {};
  graphqlUpdateTypeObject[typeName] = graphqlUpdateTypeObject[typeName] || {};
  if (isModel) {
    graphqlUpdateAllTypeObject[typeName] = graphqlUpdateAllTypeObject[typeName] || {};
  }
  graphqlAdditionalRelationFieldsInputTypeObject[typeName] = graphqlAdditionalRelationFieldsInputTypeObject[typeName] || {};
  graphqlAdditionalRelationFieldsUpdateTypeObject[typeName] = graphqlAdditionalRelationFieldsUpdateTypeObject[typeName] || {};

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
    const additionalRelationFields = getDirectiveArgumentValue(
      parsedASTMap,
      typeName,
      fieldName,
      'relation',
      'fields',
    );
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
    // for scalar type
    if (scalarTypes.includes(fieldType)) {
      graphqlScalarTypeObject[typeName][fieldName] = fieldType;
    }
    // for subdoc type
    if (!isModel && isRelationField && !scalarTypes.includes(type)) {
      // generate nestedConnectMutationStringObject to be made available for relation type
      const { relationFields } = definition;

      Object.keys(relationFields).forEach((relationalField) => {
        let key;
        if (relationalField === historyFieldName) {
          return;
        }
        // if field type is array
        if (parsedASTMap[type].field[fieldName].type.isList) {
          if (!['UserToken', 'ParentChildToken', 'ClassroomDetails'].includes(type)) {
            throw new UnsupportedListFieldInsideSubDocumentObjectError(
              {
                data: {
                  type,
                  fieldName,
                },
              },
            );
          }
        } else {
          key = `${relationalField}${connectMutationsArgumentsSuffix.singular}`;
          // pushing connect ID field in graphql Input TypeObject
          graphqlInputTypeObject[typeName][key] = 'ID';
          // pushing connect ID field in graphql Update TypeObject
          graphqlUpdateTypeObject[typeName][key] = 'ID';
        }
      });
    } else {
      const fieldInputTypeString = getFieldTypeString(
        fieldName,
        fieldType,
        isFieldList,
        isObjectTypeField,
        isRelationField,
        isRequiredField,
        hasDefaultDirective,
        hasAutoDirective,
        isUpdateType,
        haveAdditionalFields,
      );
      // Fill update type strings
      isUpdateType = true;

      const fieldUpdateTypeString = getFieldTypeString(
        fieldName,
        fieldType,
        isFieldList,
        isObjectTypeField,
        isRelationField,
        isRequiredField,
        hasDefaultDirective,
        hasAutoDirective,
        isUpdateType,
        haveAdditionalFields,
        graphqlArrayTypeObject,
      );
      // add field schema to input type object
      graphqlInputTypeObject[typeName][fieldName] = fieldInputTypeString;
      // add field schema to update type object
      graphqlUpdateTypeObject[typeName][fieldName] = fieldUpdateTypeString;
      if (isModel) {
        graphqlUpdateAllTypeObject[typeName][fieldName] = fieldUpdateTypeString;
      }
    }

    // if relation field, check for additional fields and add them.
    if (additionalRelationFields) {
      haveAdditionalFields = true;
      const relationName = getDirectiveArgumentValue(
        parsedASTMap,
        typeName,
        fieldName,
        'relation',
        'name',
      );
      graphqlInputTypeObject = appendAdditionalRelationFieldsToTypeObject(
        additionalRelationFields,
        graphqlInputTypeObject,
        fieldType,
        relationName,
        parsedASTMap,
        fieldType,
        false,
        graphqlArrayTypeObject,
      );
      const additionalTypeName = `${typeName}_${relationName}`;
      graphqlAdditionalRelationFieldsInputTypeObject = appendAdditionalRelationFieldsToTypeObject(
        additionalRelationFields,
        graphqlAdditionalRelationFieldsInputTypeObject,
        fieldType,
        relationName,
        parsedASTMap,
        additionalTypeName,
        false,
        graphqlArrayTypeObject,
      );
      graphqlAdditionalRelationFieldsUpdateTypeObject = appendAdditionalRelationFieldsToTypeObject(
        additionalRelationFields,
        graphqlAdditionalRelationFieldsUpdateTypeObject,
        fieldType,
        relationName,
        parsedASTMap,
        additionalTypeName,
        true,
        graphqlArrayTypeObject,
      );
      // Add additionalFields Update fields
      const additionalFieldName = `${fieldName}_AdditionalFields`;

      // additionalFieldType is not a List
      const isAdditionalFieldTypeList = false;
      const additionalFieldUpdateTypeString = getFieldTypeString(
        additionalFieldName,
        `${typeName}_${relationName}`,
        isAdditionalFieldTypeList,
        isObjectTypeField,
        false,
        isRequiredField,
        hasDefaultDirective,
        hasAutoDirective,
        isUpdateType,
        haveAdditionalFields,
        graphqlArrayTypeObject,
      );
      graphqlUpdateTypeObject[typeName][additionalFieldName] = additionalFieldUpdateTypeString;
      if (isModel) {
        graphqlUpdateAllTypeObject[typeName][additionalFieldName] = additionalFieldUpdateTypeString;
      }
    }
    // create enum types for uploadFile
    if (isModel && isRelationField && fieldType === 'File') {
      if (indexOf(fileConnectedTypeFieldEnumArray, fieldName) === -1) {
        fileConnectedTypeFieldEnumArray.push(fieldName);
      }
      if (indexOf(fileConnectedTypeEnumArray, type) === -1) {
        fileConnectedTypeEnumArray.push(type);
      }
    }
  });
});

// get schema strings from input schema maps
const inputTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlInputTypeObject, 'Input');
const scalarTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlScalarTypeObject, 'ScalarType');
const updateTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlUpdateTypeObject, 'Update');
const updateAllTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlUpdateAllTypeObject, 'UpdateAll', nestedConnectMutationStringObject);
const additionalRelationFieldsTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlAdditionalRelationFieldsInputTypeObject, 'Input');
const additionalRelationFieldsUpdateTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlAdditionalRelationFieldsUpdateTypeObject, 'Update');
const arrayTypesSchemaArray = getSchemaStringFromSchemaMap(graphqlArrayTypeObject, 'ArrayUpdate');

// uploadFile enumSchema
const fileConnectedTypeEnumSchema = getFileUploadEnumType(
  'FileConnectedType',
  fileConnectedTypeEnumArray,
);
const fileConnectedTypeFieldEnumSchema = getFileUploadEnumType(
  'FileConnectedTypeField',
  fileConnectedTypeFieldEnumArray,
);
const fileConnectInputSchema = `
  input FileConnectInput {
      typeId: ID, 
      type: FileConnectedType, 
      typeField: FileConnectedTypeField
      fileId: ID
  }
`;
// remove nulls from input types array
const inputTypesArray = [
  ...inputTypesSchemaArray,
  ...scalarTypesSchemaArray,
  ...updateTypesSchemaArray,
  ...updateAllTypesSchemaArray,
  ...additionalRelationFieldsTypesSchemaArray,
  ...additionalRelationFieldsUpdateTypesSchemaArray,
  ...arrayTypesSchemaArray,
  fileConnectedTypeEnumSchema,
  fileConnectedTypeFieldEnumSchema,
  fileConnectInputSchema,
];

export default inputTypesArray;
