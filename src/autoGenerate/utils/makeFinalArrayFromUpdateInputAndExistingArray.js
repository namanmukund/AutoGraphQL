import getArrayFieldsFromDocumentInput
  from '../graphql/resolvers/mutation/utils/getArrayFieldsFromDocumentInput';
import arrayOperationFunctions from '../graphql/controllers/utils/arrayOperationUtil';

// get final array from existing db array and the updation input
const makeFinalArrayFromUpdateInputAndExistingArray = (existingArray = [], arrayUpdateInput,
  input, ast, typeName) => {
  const recordArray = existingArray;
  let finalArray;
  const arrayUpdateKeys = Object.keys(arrayUpdateInput);
  const arrayFields = getArrayFieldsFromDocumentInput(input, ast, typeName);
  if (arrayUpdateKeys.length === 1) {
    const updateKey = arrayUpdateKeys[0];
    if (typeof arrayOperationFunctions[updateKey] === 'function') {
      finalArray = arrayOperationFunctions[updateKey](recordArray,
        arrayUpdateInput[updateKey], arrayFields);
    }
  } else if (arrayUpdateKeys.length === 2
    && arrayUpdateKeys.includes('updateWith') && arrayUpdateKeys.includes('updateWith')) {
    finalArray = arrayOperationFunctions.update(recordArray, arrayUpdateInput.updateWhere,
      arrayUpdateInput.updateWith,
      arrayFields);
  }
  return finalArray;
};

export default makeFinalArrayFromUpdateInputAndExistingArray;
