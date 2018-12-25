// Check in a given object value, if any field is relation field.
import isFieldDirectivePresent from '../../../../utils/isFieldDirectivePresent';

export const isRelationFieldPresent = (value, ast, schemaType) => {
  let isRelationField = false;
  const inputKeys = Object.keys(value);
  for (let i = 0; i < inputKeys.length; i += 1) {
    const key = inputKeys[i];
    if (isFieldDirectivePresent(ast, schemaType, key, 'relation')) {
      isRelationField = true;
    }
  }
  return isRelationField;
};
