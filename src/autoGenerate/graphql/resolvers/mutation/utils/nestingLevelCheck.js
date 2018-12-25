// checks if not nesting level greater than one
import { isRelationFieldPresent } from './isRelationFieldPresent';

export const nestingLevelCheck = (fieldType, fieldValue, ast, schemaType) => {
  const isList = fieldType.isList;
  let isValidNesting = false;
  // if isList check nesting level for all values
  if (isList) {
    for (let i = 0; i < fieldValue.length; i += 1) {
      isValidNesting = !isRelationFieldPresent(fieldValue[i], ast, schemaType);
      if (!isValidNesting) {
        break;
      }
    }
  } else {
    isValidNesting = !isRelationFieldPresent(fieldValue, ast, schemaType);
  }
  return isValidNesting;
};
