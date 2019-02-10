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
import regexValidation from '../../../constants/regexValidation';

const getMongooseDefaultValidations = (
  directivesObject,
  fieldType,
) => {
  const {
    unique,
    defaultValue,
    uniqueOrEmpty,
    length, uppercase, lowercase, trim, match } = directivesObject;
  const { dataType } = fieldType;
  // check if String, Int or Date field has min or max length check
  const fieldModelDefinition = {};
  if (length) {
    if (dataType === 'String') {
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
    } else if (dataType === 'Int') {
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
    } else if (dataType === 'Date') {
      if (get(directivesObject, 'length.argument.min.value.value')) {
        const date = directivesObject.length.argument.min.value.value;
        let min = new Date();
        if (date !== 'currentDate') min = new Date(date);
        fieldModelDefinition.min = [
          min,
          `minimum required value is ${min}`,
        ];
      }
      if (get(directivesObject, 'length.argument.max.value.value')) {
        const date = directivesObject.length.argument.max.value.value;
        let max = new Date();
        if (date !== 'currentDate') max = new Date(directivesObject.length.argument.max.value.value);
        fieldModelDefinition.max = [
          max,
          `maximum required value is ${max}`,
        ];
      }
    }
  }
  // add lowercase in definition if lowercase directive exists on field
  if (lowercase && dataType === 'String') {
    fieldModelDefinition.lowercase = true;
  }
  // add uppercase in definition if uppercase directive exists on field
  if (uppercase && dataType === 'String') {
    fieldModelDefinition.uppercase = true;
  }
  // add trim in definition if trim directive exists on field
  if (trim && dataType === 'String') {
    fieldModelDefinition.trim = true;
  }
  // check if String field has match directive and generate mongoose schema for same
  if (match && dataType === 'String') {
    if (get(directivesObject, 'match.argument.value.value.value')) {
      const matchRegex = directivesObject.match.argument.value.value.value; // email
      let matchValue;
      const { emailRegex, phoneRegex } = regexValidation;
      switch (matchRegex) {
        case 'emailRegex':
          matchValue = emailRegex;
          break;
        case 'phoneRegex':
          matchValue = phoneRegex;
          break;
        default:
        // do nothing
      }
      if (matchValue) {
        fieldModelDefinition.match = [
          matchValue,
          'Invalid match string',
        ];
      }
    }
  }

  // add required in definition if nonNull
  if (fieldType.isNonNull) {
    fieldModelDefinition.required = true;
  }
  // add unique in definition if unique directive exists on field
  if (unique) {
    fieldModelDefinition.unique = true;
  }

  // add sparse index on the field
  if (uniqueOrEmpty) {
    fieldModelDefinition.unique = true;
    fieldModelDefinition.sparse = true;
  }

  // check if default value entered by user is defined in enum type
  if (defaultValue) {
    const allEnumTypes = getEnumDefinitionTypeObject(types);

    if ((scalarTypes.indexOf(fieldType.dataType) < 0) &&
      !(fieldType.dataType in allEnumTypes)) {
      log(fieldType.dataType, 'error');
      throw new DefaultDirectiveAppliedOnWrongFieldError();
    }
    fieldModelDefinition.default = true;
  }

  return fieldModelDefinition;
};
const visitField = (field, ast, typeName) => {
  const fieldType = field.type;
  const fieldName = field.name.value;
  const directivesObject = field.directive;
  let singleFetchFieldParams = '';
  let fieldModelDefinition = {};

  const isRelationField = directivesObject.relation;
  const isUniqueField = directivesObject.unique;
  const isUniqueOrEmptyField = directivesObject.uniqueOrEmpty;
  const isAdditionalRelationFields = directivesObject.isRelationField;
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

    if (!fieldType.isList) {
      // implementing mongoose validation
      const updatedFieldDefinition = getMongooseDefaultValidations(
        directivesObject,
        fieldType,
      );
      Object.assign(fieldModelDefinition, updatedFieldDefinition);
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
