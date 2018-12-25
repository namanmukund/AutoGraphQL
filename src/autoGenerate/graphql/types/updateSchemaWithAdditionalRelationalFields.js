import { trimEnd } from 'lodash';
import insertSubString from '../../../../utils/insertSubString';

const getSchemaStringForRelationFields = (fieldsObject) => {
  let schemaString = ',';
  Object.keys(fieldsObject).forEach((field) => {
    schemaString += `${field}: ${fieldsObject[field]} @isRelationField, `;
  });
  schemaString = trimEnd(schemaString, ', ');
  return schemaString;
};

const updateSchemaWithAdditionalRelationalFields = (parsedASTMap, schemaTypes) => {
  Object.keys(parsedASTMap).forEach((type) => {
    const definition = parsedASTMap[type];
    const { additionalRelationFields } = definition;
    // append the additional fields in type, in the corresponding related type.
    Object.keys(additionalRelationFields).forEach((field) => {
      // get the additional relation fields for the type field
      const relationFields = additionalRelationFields[field];
      const relationFieldsSchemaString = getSchemaStringForRelationFields(relationFields);
      // get related type
      const relatedType = parsedASTMap[type].field[field].type.dataType;
      schemaTypes.some((schemaTypeString, index) => {
        if (!schemaTypeString.includes(`${relatedType} @model`)) {
          return false;
        }
        const stringEndIndex = schemaTypeString.lastIndexOf('}');
        // append additional relation fields to related type
        const appendedTypeString = insertSubString(schemaTypeString,
          stringEndIndex, relationFieldsSchemaString);
        // eslint-disable-next-line no-param-reassign
        schemaTypes[index] = appendedTypeString;
        return true;
      });
    });
  });
  return schemaTypes;
};


export default updateSchemaWithAdditionalRelationalFields;
