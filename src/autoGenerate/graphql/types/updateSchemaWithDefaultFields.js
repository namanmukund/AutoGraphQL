import insertSubString from '../../../../utils/insertSubString';
import { getTypeNameFromSchemaString } from './utils';

const defaultFieldsString = ',id: ID! @unique,createdAt: Date @readOnly,updatedAt: Date @readOnly ';

const updateSchemaWithDefaultFields = (graphqlTypes) => {
  const schemaTypes = graphqlTypes.map((type) => {
    let appendedTypeString;
    if (!type.includes('@model')) {
      return type;
    }
    const stringEndIndex = type.lastIndexOf('}');
    // @TODO: get type name from type string
    const typeName = getTypeNameFromSchemaString(type);
    if (type.includes('@history')) {
      const defaultStringWithHistory = `${defaultFieldsString}, history: [${typeName}History] @relation(name: "${typeName}HistoryRelation")`;
      appendedTypeString = insertSubString(type, stringEndIndex, defaultStringWithHistory);
    } else {
      appendedTypeString = insertSubString(type, stringEndIndex, defaultFieldsString);
    }
    // append default fields at end

    return appendedTypeString;
  });
  return schemaTypes;
};


export default updateSchemaWithDefaultFields;
