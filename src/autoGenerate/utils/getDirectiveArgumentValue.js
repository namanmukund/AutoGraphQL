import { get } from 'lodash';

// return argument for a directive
const getDirectiveArgumentValue = (
  ast,
  typeName,
  fieldName,
  directiveName,
  argumentName,
) => ast[typeName]
  && ast[typeName].field[fieldName]
  && ast[typeName].field[fieldName].directive[directiveName]
  && ast[typeName].field[fieldName].directive[directiveName].argument[
    argumentName
  ]
  && (ast[typeName].field[fieldName].directive[directiveName].argument[
    argumentName
  ].value.value
    || ast[typeName].field[fieldName].directive[directiveName].argument[
      argumentName
    ].value.values
    || ast[typeName].field[fieldName].directive[directiveName].argument[
      argumentName
    ].value.fields);

export const getTypeDirectiveArgumentValue = (
  directives,
  directiveToCheck,
  argumentName,
) => {
  let argumentValue = null;
  if (directives && directives.length) {
    directives.forEach((directive) => {
      const directiveName = directive && directive.name.value;
      if (
        directiveName === directiveToCheck
        && get(directive, 'arguments', []).length
      ) {
        const argumentsArr = get(directive, 'arguments', []);
        const argument = argumentsArr.filter(
          (arg) => get(arg, 'name.value') === argumentName,
        )[0];
        if (argument) {
          argumentValue = get(argument, 'value.value');
        }
      }
    });
  }
  return argumentValue;
};

export default getDirectiveArgumentValue;
