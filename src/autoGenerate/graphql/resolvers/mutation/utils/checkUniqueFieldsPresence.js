// check if unique fields are present in type other than id
export const checkUniqueFieldsPresence = (ast, typeName) => {
  let areUniqueFieldsPresent = false;
  const typeAst = ast[typeName];
  const uniqueFieldsInType = typeAst.localUniqueFields;
  const uniqueKeys = Object.keys(uniqueFieldsInType);
  if (uniqueKeys.length > 1 || (uniqueKeys.length === 1 && uniqueKeys[0] !== 'id')) {
    areUniqueFieldsPresent = true;
  }
  return areUniqueFieldsPresent;
};
