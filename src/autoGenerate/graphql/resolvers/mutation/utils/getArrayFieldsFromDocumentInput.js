// returns fields which are list/array types
import { isPlainObject } from 'lodash';

const getArrayFieldsFromDocumentInput = (input, ast, typeName) => {
  let arrayFieldsArray = [];
  if (!typeName || !ast[typeName]) {
    return arrayFieldsArray;
  }
  Object.keys(input).forEach((fieldName) => {
    const fieldType = ast[typeName].field[fieldName] && ast[typeName].field[fieldName].type;
    // Check typeName for nested field
    const typeNameParam = (fieldType && fieldType.dataType) || typeName;
    // Fill nested arrayFields
    if (isPlainObject(input[fieldName])) {
      arrayFieldsArray = [...arrayFieldsArray,
        ...getArrayFieldsFromDocumentInput(input[fieldName], ast, typeNameParam)];
    }
    if (!fieldType) {
      return;
    }
    const isFieldList = fieldType.isList;
    if (isFieldList) {
      arrayFieldsArray.push(fieldName);
    }
  });
  return arrayFieldsArray;
};

export default getArrayFieldsFromDocumentInput;
