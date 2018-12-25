import {
  parse,
} from 'graphql';
import { concatenateTypeDefs } from 'graphql-tools/dist/schemaGenerator';
import getParsedField from './getParsedField';

// returns a parsed simplified AST with all types
const getParsedAST = (schematypes) => {
  const initialAST = parse(concatenateTypeDefs(schematypes));
  const { definitions, ...otherKeys } = initialAST;
  const newDefinations = definitions.map((definition) => {
    const { kind, fields, ...props } = definition;
    const returnObject = {
      kind,
    };
    if (fields) {
      const fieldsArray = fields.map(fieldDefinition => getParsedField(fieldDefinition));
      returnObject.fields = fieldsArray;
    }

    return Object.assign({}, props, returnObject);
  });

  return Object.assign({}, otherKeys, {
    definitions: newDefinations,
  });
};

export default getParsedAST;
