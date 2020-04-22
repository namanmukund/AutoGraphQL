import { without } from 'lodash';

import schema from '../../../../graphqlSchema';
import insertSubString from '../../../../utils/insertSubString';
import { getTypeNameFromSchemaString } from './utils';

const application = process.env.APPLICATION || 'core';
const graphqlTypes = schema[application].types;

const historySchemaTypes = graphqlTypes.map((type) => {
  if (!type.includes('@history')) {
    return null;
  }
  // TODO: make string to enum
  const historyTypeString = 'category: HistoryCategory, subCategory: HistorySubCategory , _version: Int';
  // append history fields to schema
  const stringEndIndex = type.lastIndexOf('}');
  let historyTypeSchemaString = insertSubString(type, stringEndIndex, historyTypeString);
  // change schema type name from type to ${type}History
  const typeName = getTypeNameFromSchemaString(type);
  // replace typename with a space at end with history schema type name
  historyTypeSchemaString = historyTypeSchemaString.replace(`${typeName} `, `${typeName}History `);
  historyTypeSchemaString = historyTypeSchemaString.replace('@model', '@historyModel');
  return historyTypeSchemaString;
});

// remove nulls
const historyTypes = without(historySchemaTypes, null);
export default historyTypes;
