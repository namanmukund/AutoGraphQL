import {
  parse,
} from 'graphql';
import { concatenateTypeDefs } from 'graphql-tools';
// returns all the object which are of types 'enum' with its value
const getEnumDefinitionTypeObject = (graphqlSchemaTypes) => {
  const initialAST = parse(concatenateTypeDefs(graphqlSchemaTypes));
  const { definitions } = initialAST;
  const allEnumTypesObject = {};
  definitions.forEach((definition) => {
    const { kind, values } = definition;
    if (kind !== 'EnumTypeDefinition' || !values || !values.length) {
      return null;
    }
    const enumNameArray = [];
    const fieldName = definition.name.value;
    values.forEach((field) => {
      enumNameArray.push(field.name.value);
    });
    allEnumTypesObject[fieldName] = Object.assign({}, { enum: enumNameArray });
    return null;
  });
  return allEnumTypesObject;
};

export default getEnumDefinitionTypeObject;
