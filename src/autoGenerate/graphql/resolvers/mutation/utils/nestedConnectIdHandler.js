import updateInputInCaseOfNestedConnect from './updateInputInCaseOfNestedConnect';
import { arrayUpdateAddTypes, arrayUpdateRemoveTypes } from '../../../../../../constants';
import generateObjectToBeDisconnected from './generateObjectToBeDisconnected';

const nestedConnectIdHandler = (
  ast,
  typeName,
  input,
) => {
  const finalInput = { ...input };
  const allRelationObjectsArray1to1Data = [];
  const allRelationObjectsArray1toMData = [];
  const nestedDisconnectObjInfo = {};
  let isArrayUpdate = false;

  Object.keys(finalInput).forEach((inputFieldName) => {
    // special case for update
    const fieldKeys = Object.keys(finalInput[inputFieldName]);
    // for operations like push, pushMany and all
    if (
      fieldKeys
        && fieldKeys.length
        && arrayUpdateAddTypes.includes(fieldKeys[0])
    ) {
      isArrayUpdate = true;
      // case of pushMany
      if (Array.isArray(finalInput[inputFieldName][fieldKeys[0]])) {
        Object.assign(finalInput, {
          [inputFieldName]: finalInput[inputFieldName][fieldKeys[0]],
        });
      } else {
        // case of push
        Object.assign(finalInput, {
          [inputFieldName]: [finalInput[inputFieldName][fieldKeys[0]]],
        });
      }
    }
    // for operations like pop, popMany and replace too
    if (
      fieldKeys
          && fieldKeys.length
        && (
          arrayUpdateRemoveTypes.includes(fieldKeys[0])
            || arrayUpdateRemoveTypes.includes('replace')
        )
    ) {
      generateObjectToBeDisconnected(
        ast,
        typeName,
        inputFieldName,
        nestedDisconnectObjInfo,
      );
    }

    if (
      Array.isArray(finalInput[inputFieldName])
            && finalInput[inputFieldName].length
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
    } else if (
      typeof finalInput[inputFieldName] === 'object'
        && !Array.isArray(finalInput[inputFieldName])
    ) {
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
      // send the object as an array
      if (fieldKeys[0] === 'pushMany' || fieldKeys[0] === 'replace') {
        Object.assign(finalInput, {
          [inputFieldName]: {
            [fieldKeys[0]]: finalInput[inputFieldName],
          },
        });
      } else {
        Object.assign(finalInput, {
          [inputFieldName]: {
            [fieldKeys[0]]: finalInput[inputFieldName][0],
          },
        });
      }
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
