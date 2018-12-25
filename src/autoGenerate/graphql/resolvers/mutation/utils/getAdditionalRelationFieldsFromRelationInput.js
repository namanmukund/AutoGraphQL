import getDirectiveArgumentValue from '../../../../utils/getDirectiveArgumentValue';

export const getAdditionalRelationFieldsFromRelationInput = (fieldValue, ast,
  fieldName, typeName, relationName) => {
  const inputValue = Object.assign({}, fieldValue);
  const additionalRelationFields = getDirectiveArgumentValue(ast, typeName, fieldName, 'relation', 'fields');

  const additionalRelationFieldsObject = {};
  if (!additionalRelationFields) {
    return { additionalRelationFieldsObject, inputValue };
  }

  additionalRelationFields.forEach((fieldObject) => {
    const additionalFieldName = fieldObject.name.value;
    // name as in the mutation input
    const additionalFieldNameInInput = `${relationName}_${additionalFieldName}`;
    if (fieldValue[additionalFieldNameInInput]) {
      additionalRelationFieldsObject[additionalFieldName] =
        fieldValue[additionalFieldNameInInput];
      // delete additional field key from value to save, since we want that only in relation
      delete inputValue[additionalFieldNameInInput];
    }
  });
  return { additionalRelationFieldsObject, inputValue };
};
