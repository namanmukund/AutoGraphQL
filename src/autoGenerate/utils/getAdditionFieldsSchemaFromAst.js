import { has } from 'lodash';
import types from '../graphql/types';
import getEnumDefinitionTypeObject from './getEnumDefinitionTypeObject';
import getScalarFieldDefinition from './getScalarFieldDefinition';
import getEnumTypeMongooseSchema from './getEnumTypeMongooseSchema';
// make model schema and query fetch params from field definition
const getAdditionFieldsSchemaFromAst = (ast, relatedModelType, additionalRelationFields) => {
  const fieldsSchemaObject = {};
  additionalRelationFields.forEach((fieldObject) => {
    const fieldName = fieldObject.name.value;
    // get field type from related model ast

    const isFieldListKind = fieldObject.value.kind === 'ListValue';
    const fieldType = isFieldListKind ? fieldObject.value.values[0].value : fieldObject.value.value;
    const allEnumTypesObject = getEnumDefinitionTypeObject(types);

    let fieldModelDefinition;
    fieldModelDefinition = getScalarFieldDefinition(fieldType);
    // handle if field is enum type
    const isFieldEnumType = has(allEnumTypesObject, fieldModelDefinition.type);
    if (isFieldEnumType) {
      const enumArray = allEnumTypesObject[fieldType].enum;
      fieldModelDefinition = getEnumTypeMongooseSchema(fieldModelDefinition, enumArray);
    }
    if (isFieldListKind) {
      fieldModelDefinition = [fieldModelDefinition];
    }
    fieldsSchemaObject[fieldName] = fieldModelDefinition;
  });
  return fieldsSchemaObject;
};

export default getAdditionFieldsSchemaFromAst;
