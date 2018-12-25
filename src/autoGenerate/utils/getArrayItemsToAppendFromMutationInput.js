// from graphql update array mutation input, get the array items to be appended
// returns array of items to be appended
const getArrayItemsToAppendFromMutationInput = (arrayUpdateInput) => {
  const arrayUpdateKeys = Object.keys(arrayUpdateInput);
  // value being pushed to array
  let arrayItemsToAppend;
  // check the number of keys in update array object
  // 2 args are recieved only when update with and where are used
  if (arrayUpdateKeys.length === 1) {
    const updateKey = arrayUpdateKeys[0];
    if (['push', 'pushMany', 'replace', 'pushToSet', 'updateAll'].includes(updateKey)) {
      arrayItemsToAppend = arrayUpdateInput[updateKey];
    }
  } else if (arrayUpdateKeys.length === 2 && arrayUpdateKeys.includes('updateWith')) {
    arrayItemsToAppend = arrayUpdateInput.updateWith;
  }
  // if a non array value was recieved in input, make it to array
  if (arrayItemsToAppend && !Array.isArray(arrayItemsToAppend)) {
    arrayItemsToAppend = [arrayItemsToAppend];
  }
  return arrayItemsToAppend;
};

export default getArrayItemsToAppendFromMutationInput;
