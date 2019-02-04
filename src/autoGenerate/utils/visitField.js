import { get, includes } from 'lodash';
import types from '../graphql/types';
import { scalarTypes } from '../../../constants';
import { log } from '../../../utils/log';
import { DefaultDirectiveAppliedOnWrongFieldError } from '../../../constants/errors';
import getEnumDefinitionTypeObject from './getEnumDefinitionTypeObject';
import getDirectiveArgumentValue from './getDirectiveArgumentValue';
import getAdditionFieldsSchemaFromAst from './getAdditionFieldsSchemaFromAst';
import getRelationFieldDefinition from './getRelationFieldDefinition';
import getScalarFieldDefinition from './getScalarFieldDefinition';

const visitField = (field, ast, typeName) => {
  const fieldType = field.type;
  const fieldName = field.name.value;
  const directivesObject = field.directive;
  let singleFetchFieldParams = '';
  let fieldModelDefinition = {};

  const isRelationField = directivesObject.relation;
  const isUniqueField = directivesObject.unique;
  const isDefaultField = directivesObject.defaultValue;
  const isUniqueOrEmptyField = directivesObject.uniqueOrEmpty;
  const isAdditionalRelationFields = directivesObject.isRelationField;
  const isFieldLengths = directivesObject.length;
  if (isAdditionalRelationFields) {
    return null;
  }
  // if relation then definition is relation type else definiton is scalar type
  if (isRelationField) {
    // @TODO add validation for required type and typeId in Hooks

    const additionalRelationFields = getDirectiveArgumentValue(ast, typeName, fieldName, 'relation', 'fields');
    let additionFieldsSchema;

    if (additionalRelationFields) {
      // the model the field is related with
      const relatedModelType = fieldType.dataType;

      additionFieldsSchema = getAdditionFieldsSchemaFromAst(ast, relatedModelType,
        additionalRelationFields);
    }

    fieldModelDefinition = getRelationFieldDefinition(additionFieldsSchema);
    if (!fieldType.isList) {
      // add required in definition if nonNull
      if (fieldType.isNonNull) {
        fieldModelDefinition.typeId.required = true;
      }
      // add unique in definition if unique directive exists on field
      if (isUniqueField) {
        fieldModelDefinition.typeId.unique = true;
      }
    } else {
      // if list
      if (fieldType.isListIsNonNull) {
        fieldModelDefinition.typeId.required = true;
      }
      fieldModelDefinition = [fieldModelDefinition];
    }
  } else {
    fieldModelDefinition = getScalarFieldDefinition(fieldType.dataType);
    // generate mongoose schema for min max length field
    if (isFieldLengths && fieldType && fieldType.dataType === 'String') {
      if (get(directivesObject, 'length.argument.min.value.value')) {
        const minLength = Number(directivesObject.length.argument.min.value.value);
        fieldModelDefinition.minlength = [
          minLength,
          `minimum required length is ${minLength}`,
        ];
      }
      if (get(directivesObject, 'length.argument.max.value.value')) {
        const maxLength = Number(directivesObject.length.argument.max.value.value);
        fieldModelDefinition.maxlength = [
          maxLength,
          `maximum required length is ${maxLength}`,
        ];
      }
    } else if (isFieldLengths && fieldType && fieldType.dataType === 'Int') {
      if (get(directivesObject, 'length.argument.min.value.value')) {
        const min = Number(directivesObject.length.argument.min.value.value);
        fieldModelDefinition.min = [
          min,
          `minimum required value is ${min}`,
        ];
      }
      if (get(directivesObject, 'length.argument.max.value.value')) {
        const max = Number(directivesObject.length.argument.max.value.value);
        fieldModelDefinition.max = [
          max,
          `maximum required value is ${max}`,
        ];
      }
    }
    if (!fieldType.isList) {
      // add required in definition if nonNull
      if (fieldType.isNonNull) {
        fieldModelDefinition.required = true;
      }
      // add unique in definition if unique directive exists on field
      if (isUniqueField) {
        fieldModelDefinition.unique = true;
      }

      // @TODO apply sparse index
      // add sparse index on the field
      if (isUniqueOrEmptyField) {
        fieldModelDefinition.unique = true;
        fieldModelDefinition.sparse = true;
      }
      const allEnumTypes = getEnumDefinitionTypeObject(types);
      if (isDefaultField) {
        if ((scalarTypes.indexOf(fieldType.dataType) < 0) &&
          !(fieldType.dataType in allEnumTypes)) {
          log(fieldType.dataType, 'error');
          throw new DefaultDirectiveAppliedOnWrongFieldError();
        }
        fieldModelDefinition.default = true;
      }
    } else {
      if (fieldType.isListIsNonNull) {
        fieldModelDefinition.required = true;
      }
      fieldModelDefinition = [fieldModelDefinition];
    }
  }
  // return null for id
  if (!Object.keys(fieldModelDefinition).length) {
    return null;
  }
  // add field fetch param in query string
  if (includes(scalarTypes, fieldType.dataType)) {
    if (isUniqueField || isUniqueOrEmptyField) {
      singleFetchFieldParams += `${field.name.value}: ${fieldType.dataType},`;
    }
  }
  const returnObject = { fieldModelDefinition, singleFetchFieldParams };
  return returnObject;
};

export default visitField;
