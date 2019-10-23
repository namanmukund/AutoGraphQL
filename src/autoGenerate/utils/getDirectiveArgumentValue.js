// return argument for a directive
const getDirectiveArgumentValue = (ast, typeName, fieldName, directiveName, argumentName) => ast[typeName] && ast[typeName].field[fieldName]
  && ast[typeName].field[fieldName].directive[directiveName]
  && ast[typeName].field[fieldName].directive[directiveName].argument[argumentName]
  && (ast[typeName].field[fieldName].directive[directiveName].argument[argumentName].value.value
    || ast[typeName].field[fieldName].directive[directiveName].argument[argumentName].value.values
    || ast[typeName].field[fieldName].directive[directiveName].argument[argumentName].value.fields
  );

export default getDirectiveArgumentValue;
