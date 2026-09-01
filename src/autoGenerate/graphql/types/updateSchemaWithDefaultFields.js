import insertSubString from '../../../../utils/insertSubString';
import { getTypeNameFromSchemaString } from './utils';

const defaultFieldsString = ',id: ID! @unique,createdAt: Date @readOnly @createIndex(value: 1),updatedAt: Date @readOnly ';

const updateSchemaWithDefaultFields = (graphqlTypes) => {
  const schemaTypes = graphqlTypes.map((type) => {
    if (!type.includes('@model')) {
      return type;
    }
    const stringEndIndex = type.lastIndexOf('}');
    const typeName = getTypeNameFromSchemaString(type);

    const fieldsToInject = [];
    if (!type.match(/\bid\s*:/)) {
      fieldsToInject.push('id: ID! @unique');
    }
    if (!type.match(/\bcreatedAt\s*:/)) {
      fieldsToInject.push('createdAt: Date @readOnly @createIndex(value: 1)');
    }
    if (!type.match(/\bupdatedAt\s*:/)) {
      fieldsToInject.push('updatedAt: Date @readOnly');
    }
    if (type.includes('@history') && !type.match(/\bhistory\s*:/)) {
      fieldsToInject.push(`history: [${typeName}History] @relation(name: "${typeName}HistoryRelation")`);
    }

    if (fieldsToInject.length === 0) {
      return type;
    }

    const injectionString = `, ${fieldsToInject.join(', ')}`;
    return insertSubString(type, stringEndIndex, injectionString);
  });
  return schemaTypes;
};

export default updateSchemaWithDefaultFields;
