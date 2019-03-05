import updateInputInCaseOfNestedConnect from './updateInputInCaseOfNestedConnect';
import { arrayUpdateAddTypes, arrayUpdateRemoveTypes } from '../../../../../../constants';

const nestedConnectIdHandler = (
  ast,
  typeName,
  input,
) => {
  const finalInput = Object.assign({}, input);
  const allRelationObjectsArray1to1Data = [];
  const allRelationObjectsArray1toMData = [];
  const nestedDisconnectObjInfo = {};
  Object.keys(finalInput).forEach((inputFieldName) => {
    // special case for update
    const fieldKeys = Object.keys(finalInput[inputFieldName]);
    let isArrayUpdate = false;
    // for operations like push, pushMany and all
    if (
      fieldKeys &&
        fieldKeys.length &&
        arrayUpdateAddTypes.includes(fieldKeys[0])
    ) {
      isArrayUpdate = true;
      Object.assign(finalInput, {
        [inputFieldName]: finalInput[inputFieldName][fieldKeys[0]],
      });
    }

    // for operations like pop, popMany and all
    if (
      fieldKeys &&
          fieldKeys.length &&
        arrayUpdateRemoveTypes.includes(fieldKeys[0])
    ) {
      isArrayUpdate = true;
      Object.assign(finalInput, {
        [inputFieldName]: finalInput[inputFieldName][fieldKeys[0]],
      });
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
        Object.keys(relatedDataTypeRelationalFields).forEach((relationObjKey) => {
          if (relatedDataTypeRelationalFields[relationObjKey] === relationName) {
            relatedFieldName = relationObjKey;
          }
        });
        if (relatedFieldName) {
          isRelatedFieldAList = ast[relatedDataType].field[relatedFieldName].type.isList || false;
        }
        if (relatedFieldName || relatedDataType === 'File') {
          Object.assign(nestedDisconnectObjInfo, {
            [nestedField]: {
              relationName,
              nestedFieldName: nestedField,
              nestedDataType: nestedFieldDataType,
              typeName,
              relatedDataType,
              removeOperationType: fieldKeys[0],
              relatedFieldName,
              isRelatedFieldAList,
            },
          });
        }
      });
    }
    if (
      Array.isArray(finalInput[inputFieldName]) &&
            finalInput[inputFieldName].length
    ) {
      const typeTypeIdArray = [];
      const arrayObjects = [];
      const mappingInfo = {};
      finalInput[inputFieldName].forEach((doc) => {
        const modifiedInput = {};
        updateInputInCaseOfNestedConnect(
          ast,
          typeName,
          inputFieldName,
          modifiedInput,
          arrayObjects,
          doc,
          mappingInfo,
          isArrayUpdate,
        );
        typeTypeIdArray.push(modifiedInput);
      });
      allRelationObjectsArray1toMData.push(arrayObjects);
      finalInput[inputFieldName] = typeTypeIdArray;
    } else if (typeof finalInput[inputFieldName] === 'object') {
      const modifiedInput = {};
      const mappingInfo = {};
      const arrayObjects = [];
      updateInputInCaseOfNestedConnect(
        ast,
        typeName,
        inputFieldName,
        modifiedInput,
        arrayObjects,
        finalInput[inputFieldName],
        mappingInfo,
      );
      finalInput[inputFieldName] = modifiedInput;
      Object.assign(allRelationObjectsArray1to1Data, [...arrayObjects]);
    }
    // if case of push or push many then restore the keywords and proceed
    if (isArrayUpdate) {
      Object.assign(finalInput, {
        [inputFieldName]: {
          [fieldKeys[0]]: finalInput[inputFieldName],
        },
      });
    }
  });

  return {
    finalInput,
    allRelationObjectsArray1to1Data,
    allRelationObjectsArray1toMData,
    nestedDisconnectObjInfo,
  };
};

export default nestedConnectIdHandler;
