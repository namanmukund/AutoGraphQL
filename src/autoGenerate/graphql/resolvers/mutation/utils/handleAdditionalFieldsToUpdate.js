// returns additional relation fields
import { isAdditionalFieldName } from './isAdditionalFieldName';

const handleAdditionalFieldsToUpdate = (input, ast, typeName) => {
  const finalInput = {};
  const relationAdditionalFieldsArray = [];
  const arrayAdditionalFields = [];
  Object.keys(input)
    .forEach((fieldName) => {
      const { isAdditionalField, originalFieldname, originalFieldValue } = isAdditionalFieldName(typeName, ast, fieldName, input);
      if (isAdditionalField) {
        finalInput[originalFieldname] = originalFieldValue;
        if (!relationAdditionalFieldsArray.includes(originalFieldname)) {
          relationAdditionalFieldsArray.push(originalFieldname);
        }
        const additionalFields = ast[typeName].field[originalFieldname].directive.relation.argument.fields.value.fields;
        additionalFields.forEach((field) => {
          if (field.value.kind === 'ListValue') {
            arrayAdditionalFields.push(field.name.value);
          }
        });
      } else {
        finalInput[fieldName] = input[fieldName];
      }
    });
  return { finalInput, relationAdditionalFieldsArray, arrayAdditionalFields };
};
export { handleAdditionalFieldsToUpdate };
