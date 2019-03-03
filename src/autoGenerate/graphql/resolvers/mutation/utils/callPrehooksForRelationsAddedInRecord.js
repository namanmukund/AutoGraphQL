import callConnectMutationPreHook from './callConnectMutationPreHook';

const callPrehooksForRelationsAddedInRecord = async (
  inputMap,
  recordId,
  mutationType,
  ast,
  context,
) => {
  const {
    allRelationObjectsArray1to1,
    allRelationObjectsArray1toM,
    finalInput,
  } = inputMap;
  const newContext = Object.assign({}, context);
  newContext.record = finalInput;
  // call prehooks for 1-1 relations added
  const promiseArray1to1 = allRelationObjectsArray1to1.map((relationObject) => {
    console.log(11111, relationObject);
    return callConnectMutationPreHook(
      recordId,
      relationObject,
      finalInput,
      mutationType,
      ast,
      newContext,
    );
  });

  await Promise.all(promiseArray1to1).then((result) => {
    console.log(2222, result);
    return result;
  });

  // call prehooks for 1-M relations added
  const oneToManyRelationsArray = [];
  // get array from nested array
  allRelationObjectsArray1toM.forEach((relationArray) => {
    relationArray.forEach(async (relationObject) => {
      oneToManyRelationsArray.push(relationObject);
    });
  });

  const promiseArray1toM = oneToManyRelationsArray.map(relationObject =>
    callConnectMutationPreHook(recordId, relationObject,
      finalInput, mutationType, ast, newContext));
  await Promise.all(promiseArray1toM).then((res) => {
    console.log(1111, res);
    return res;
  });
};
export { callPrehooksForRelationsAddedInRecord };
