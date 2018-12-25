// Checks if fieldName is additionalFieldName
export const isAdditionalFieldName = (typeName, ast, fieldName, input) => {
  const splitFieldName = fieldName.split('_');
  if (splitFieldName.length === 2 &&
    splitFieldName[1] === 'AdditionalFields' &&
    ast[typeName].field[splitFieldName[0]]) {
    const originalFieldValue = Object.assign({}, input[fieldName]);
    // Check if it is an object && !array && !null
    if (typeof originalFieldValue === 'object' &&
      originalFieldValue.hasOwnProperty && Object(originalFieldValue) === originalFieldValue) {
      Object.keys(input[fieldName])
        .forEach((value) => {
          const splitFieldValue = value.split('_');
          if (splitFieldValue.length === 2 &&
            ast[typeName].relationFields[splitFieldName[0]] === splitFieldValue[0]) {
            delete originalFieldValue[value];
            originalFieldValue[splitFieldValue[1]] = input[fieldName][value];
          }
        });
    }
    return {
      isAdditionalField: true,
      originalFieldname: splitFieldName[0],
      originalFieldValue,
    };
  }
  return { isAdditionalField: false };
};
