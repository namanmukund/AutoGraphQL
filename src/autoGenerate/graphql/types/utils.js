import { without, upperFirst, has, get, camelCase } from 'lodash';
import pluralize from 'pluralize';

// returns type string of a field
const getFieldTypeString = (fieldName, fieldType, isFieldList,
  isObjectTypeField, isRelationField, isRequiredField,
  hasDefaultDirective, hasAutoDirective, isUpdateType, isAdditionalField,
  graphqlArrayTypeObject = {}) => {
  let fieldTypeString;
  // Check if array type and updateType but not relation
  if (isFieldList && isUpdateType && !isRelationField) {
    // Array update string
    fieldTypeString = `${upperFirst(fieldName)}ArrayUpdate`;
    let tempFieldTypeString = fieldType;
    // adding input to tempFieldTypeString if object field
    tempFieldTypeString += isObjectTypeField ? 'Input' : '';
    let tempFieldTypeStringUpdate = fieldType;
    // adding update to tempFieldTypeString if object field with update
    tempFieldTypeStringUpdate += isObjectTypeField ? 'Update' : '';

    // Create array input object if not there
    if (!graphqlArrayTypeObject[upperFirst(fieldName)]) {
      /* eslint-disable no-param-reassign */
      graphqlArrayTypeObject[upperFirst(fieldName)] = {
        /* eslint-enable no-param-reassign */
        push: tempFieldTypeString,
        push__description: `push a/an ${fieldType} to array`,
        pushMany: `[${tempFieldTypeString}]`,
        pushMany__description: `pushMany ${fieldType}s to array`,
        replace: `[${tempFieldTypeString}]`,
        replace__description: `replace the whole ${fieldType} array`,
        pushToSet: tempFieldTypeString,
        pushToSet__description: `pushToSet pushes a/an ${fieldType} to array unless it is already present, in which case it does nothing`,
        popFront: 'Boolean',
        popFront__description: `pop a/an ${fieldType} from front of array`,
        popBack: 'Boolean',
        popBack__description: `pop a/an ${fieldType} from back of array`,
        popAll: 'Boolean',
        popAll__description: `pop all ${fieldType}s from array`,
        updateAll: tempFieldTypeStringUpdate,
        updateAll__description: `update all ${fieldType}s inside array with given value. In case of array of objects it will only update provided fields`,
        updateWhere: `${fieldType}Filter`,
        updateWhere__description: `filter all ${fieldType}s inside array which you want to update. Always used in conjunction with "updateWith"`,
        updateWith: tempFieldTypeStringUpdate,
        updateWith__description: `update all ${fieldType}s inside array which are matched by "updateWhere" filter, with given value. In case of array of objects it will only update provided fields. Always used in conjunction with "updateWhere"`,
        pop: `${fieldType}Filter`,
        pop__description: `pop those ${fieldType}s from array which matches the provided filter`,
      };
    }
  } else {
    // If not an array field
    fieldTypeString = fieldType;
    // Check if update type or not
    if (isUpdateType && !isRelationField) {
      fieldTypeString += isObjectTypeField ? 'Update' : '';
    } else {
      fieldTypeString += isObjectTypeField ? 'Input' : '';
    }
    // add '!' if required field, but not for update type, or field with default directive
    fieldTypeString += (isRequiredField && !isUpdateType && !hasDefaultDirective && !isRelationField && !hasAutoDirective) ? '!' : '';
    if (isFieldList) {
      fieldTypeString = `[${fieldTypeString}]`;
    }
  }
  return fieldTypeString;
};

// add addtnl fields to the related types schema object
const appendAdditionalRelationFieldsToTypeObject = (additionalRelationFields, typeObject,
  relatedTypeName, relationName, ast, typeName, isUpdateType, graphqlArrayTypeObject) => {
  const inputTypeObject = Object.assign({}, typeObject);
  // if related types schema is not already appended, initialize it
  inputTypeObject[typeName] =
    inputTypeObject[typeName] || {};
  // Create input/update type for each additionalField
  additionalRelationFields.forEach((fieldObject) => {
    const fieldName = fieldObject.name.value;
    const additionalFieldName = `${relationName}_${fieldName}`;
    const isFieldListKind = fieldObject.value.kind === 'ListValue';
    const fieldType = isFieldListKind ? fieldObject.value.values[0].value : fieldObject.value.value;
    const isObjectTypeField = ast[fieldType];
    // Get input/update type string
    const fieldInputTypeString = getFieldTypeString(fieldName, fieldType, isFieldListKind,
      isObjectTypeField, false, false, false, false, isUpdateType, false, graphqlArrayTypeObject);
    // Delete additional keys field name from inputtypes
    delete inputTypeObject[typeName][fieldName];
    // Add additionalField names with relation info key to input types
    inputTypeObject[typeName][additionalFieldName] = fieldInputTypeString;
    if (isUpdateType && isFieldListKind) {
      inputTypeObject[typeName].id = 'ID!';
    }
  });
  return inputTypeObject;
};

// args: typeOfInput: input or update type, schemaMap
const getSchemaStringFromSchemaMap = (
  schemaMap,
  typeOfInput,
  nestedConnectMutationStringObject = {},
) =>
  without(Object.keys(schemaMap).map((type) => {
    const typeSchema = schemaMap[type];
    const allFields = Object.keys(typeSchema);
    if (!allFields.length) {
      return null;
    }

    let typeName = type;
    let inputType = typeOfInput;

    if (typeOfInput === 'UpdateAll') {
      typeName = camelCase(pluralize(type));
      inputType = 'Update';
    }

    let restString = '';
    let typeString = `input ${typeName}${inputType} {`;
    allFields.forEach((field) => {
      if (!field.endsWith('__description')) {
        const fieldType = typeSchema[field];
        if (has(typeSchema, `${field}__description`)) {
          const description = get(typeSchema, `${field}__description`);
          restString += `\n #  ${description} \n`;
        }
        restString += `${field}: ${fieldType} `;
      }
    });

    if (typeOfInput === 'UpdateAll') {
      typeString += `id: ID!, fields: ${type}${inputType}!, 
      ${(nestedConnectMutationStringObject && nestedConnectMutationStringObject[type]) ? nestedConnectMutationStringObject[type] : ''} `;
    } else {
      typeString += restString;
    }

    typeString += '}';
    return typeString;
  }), null);

const getTypeNameFromSchemaString = (typeString) => {
  // regex to get string b/w type and @model substrings
  let typeName = typeString.match('type(.*)@model')[1];
  typeName = typeName.trim();
  return typeName;
};

// generate enum type graphql schema
const getFileUploadEnumType = (enumTypeName, enumArray) => {
  let typeString = `enum ${enumTypeName} {`;
  enumArray.forEach((enumVal) => {
    typeString += `${enumVal} `;
  });
  typeString += '}';
  return typeString;
};

export {
  getFieldTypeString,
  appendAdditionalRelationFieldsToTypeObject,
  getSchemaStringFromSchemaMap, getTypeNameFromSchemaString,
  getFileUploadEnumType,
};
