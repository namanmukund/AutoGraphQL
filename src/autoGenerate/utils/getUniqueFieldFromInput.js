// returns field with unique directive from given fields
import isFieldDirectivePresent from './isFieldDirectivePresent';

const getUniqueFieldFromInput = (input, ast, schemaType) => {
  if (!input) {
    return null;
  }
  const inputKeys = Object.keys(input);
  let uniqueField;
  if (input.id) {
    uniqueField = 'id';
    return uniqueField;
  }
  for (let i = 0; i < inputKeys.length; i += 1) {
    const key = inputKeys[i];
    if (isFieldDirectivePresent(ast, schemaType, key, 'unique') || isFieldDirectivePresent(ast, schemaType, key, 'uniqueOrEmpty')) {
      uniqueField = key;
      break;
    }
  }
  return uniqueField;
};

export default getUniqueFieldFromInput;
