import insertSubString from '../../../../utils/insertSubString';

const updateSchemaWithUserToken = (schemaTypes) => {
  const tokenString = ',token: String!';
  const totalSchemaTypes = schemaTypes.length;
  schemaTypes.some((type) => {
    if (type.includes('User @model')) {
      let userTokenSchemaString = type.replace('User @model', 'UserToken');
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


export default updateSchemaWithUserToken;
