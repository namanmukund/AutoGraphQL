import {
  parse,
} from 'graphql';
import { concatenateTypeDefs } from 'graphql-tools';
// returns all the object which are of types 'enum' with its value
const getEnumDefinitionTypeObject = (schematypes) => {
  const initialAST = parse(concatenateTypeDefs(schematypes));
  const { definitions } = initialAST;
  const allEnumTypesObject = {};
  definitions.forEach((definition) => {
    const { kind, values } = definition;
    if (kind !== 'EnumTypeDefinition' || !values || !values.length) {
      return null;
    }
    const enumNameArray = [];
    const fieldname = definition.name.value;
    values.forEach((field) => {
      enumNameArray.push(field.name.value);
    });
    allEnumTypesObject[fieldname] = Object.assign({}, { enum: enumNameArray });
    return null;
  });
  return allEnumTypesObject;
};

export default getEnumDefinitionTypeObject;
