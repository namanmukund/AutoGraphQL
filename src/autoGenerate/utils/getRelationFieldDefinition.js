const getRelationFieldDefinition = (additionalRelationFields) => {
  const schemaDefinitionObject = { typeId: { type: 'String' }, type: { type: 'String' } };
  if (!additionalRelationFields || !Object.keys(additionalRelationFields).length) {
    return schemaDefinitionObject;
  }
  // append additional fields
  Object.keys(additionalRelationFields)
    .forEach((fieldName) => {
      schemaDefinitionObject[fieldName] = additionalRelationFields[fieldName];
    });
  return schemaDefinitionObject;
};

export default getRelationFieldDefinition;
