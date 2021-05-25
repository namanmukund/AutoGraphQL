import insertSubString from '../../../../utils/insertSubString';

const updateSchemaWithParentChildToken = (schemaTypes) => {
  const tokenString = ',token: String, children:[ChildrenToken]';
  const totalSchemaTypes = schemaTypes.length;
  schemaTypes.some((type) => {
    if (type.includes('User @model')) {
      let userTokenSchemaString = type.replace('User @model', 'ParentChildToken');
      const stringEndIndex = userTokenSchemaString.lastIndexOf('}');
      // get token type schema string
      userTokenSchemaString = insertSubString(userTokenSchemaString, stringEndIndex, tokenString);

      // add to types Array
      // eslint-disable-next-line no-param-reassign
      schemaTypes[totalSchemaTypes] = userTokenSchemaString;
      return true;
    }
    return false;
  });
  return schemaTypes;
};

export default updateSchemaWithParentChildToken;
