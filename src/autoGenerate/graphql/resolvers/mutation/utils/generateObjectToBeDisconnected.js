const generateObjectToBeDisconnected = (
  ast,
  typeName,
  inputFieldName,
  nestedDisconnectObjInfo,
  fieldRelationName,
) => {
  const nestedFieldDataType = ast[typeName].field[inputFieldName].type.dataType;
  // info like type or directive
  const nestedFieldRelationFieldsObj = ast[nestedFieldDataType].relationFields;

  Object.keys(nestedFieldRelationFieldsObj).forEach((nestedField) => {
    const nestedFieldInfo = ast[nestedFieldDataType].field[nestedField];
    const relatedDataType = nestedFieldInfo.type.dataType;
    const relationName = nestedFieldRelationFieldsObj[nestedField];
    const relatedDataTypeRelationalFields = ast[relatedDataType].relationFields;
    let relatedFieldName = '';
    let isRelatedFieldAList = false;
    let isNestedFieldAList = false;
    Object.keys(relatedDataTypeRelationalFields).forEach((relationObjKey) => {
      if (relatedDataTypeRelationalFields[relationObjKey] === relationName) {
        relatedFieldName = relationObjKey;
      }
    });
    if (relatedFieldName) {
      // for sub doc
      isRelatedFieldAList = ast[relatedDataType].field[relatedFieldName].type.isList || false;
      // for primary level
      isNestedFieldAList = ast[nestedFieldDataType].field[nestedField].type.isList || false;
    }
    if (relatedFieldName || relatedDataType === 'File') {
      /*
      fieldRelationName is provided then assign only for that field
      else for relation name of that field
       */
      if ((fieldRelationName && fieldRelationName === relationName) || !fieldRelationName) {
        Object.assign(nestedDisconnectObjInfo, {
          [nestedField]: {
            relationName,
            nestedFieldName: nestedField,
            nestedDataType: nestedFieldDataType,
            typeName,
            relatedDataType,
            relatedFieldName,
            isRelatedFieldAList,
            isNestedFieldAList,
          },
        });
      }
    }
  });
  return null;
};


export default generateObjectToBeDisconnected;
