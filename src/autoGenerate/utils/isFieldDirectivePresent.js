const isFieldDirectivePresent = (ast, schemaType, fieldName, directiveName) => {
  if (ast[schemaType] && ast[schemaType].field[fieldName] &&
    ast[schemaType].field[fieldName].directive[directiveName]) {
    return true;
  }
  return false;
};
export default isFieldDirectivePresent;
