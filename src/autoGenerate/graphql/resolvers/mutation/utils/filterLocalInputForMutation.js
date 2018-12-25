// including id field.
import { merge, pick } from 'lodash';

const filterLocalInputForMutation = (
  typeName,
  cuidInput, // Actual input.
  mergedValue, // Value received from mutation.
  ast,
) => {
  // Check if input has remote relation fields.
  const { localFields } = ast[typeName];
  const inputWithRemotevalues = merge(cuidInput, mergedValue);
  const remoteRelationFields = ast[typeName].remoteRelationFields;
  const localInputWithRemoteRelations =
    pick(inputWithRemotevalues, Object.keys(remoteRelationFields));
  // In each input field which are remote relation, pick only local fields.
  Object.keys(localInputWithRemoteRelations)
    .forEach((remoteFieldKey) => {
      const relationInput = localInputWithRemoteRelations[remoteFieldKey];
      const fieldTypeName = remoteRelationFields[remoteFieldKey].type;
      const relationLocalFields = ast[fieldTypeName].localFields;
      let filteredRelationInput = '';
      if (Array.isArray(relationInput)) {
        if (relationInput.length) {
          filteredRelationInput = relationInput.map((relationInputValue) => {
            const keysArray = Object.keys(Object.assign({}, relationLocalFields, {
              id: true,
            }));
            const finalRelationInput = pick(relationInputValue, keysArray);
            return finalRelationInput;
          });
        }
      } else if (relationInput) {
        filteredRelationInput = pick(relationInput, Object.keys(
          Object.assign({}, relationLocalFields, {
            id: true,
          })));
      }
      if (filteredRelationInput) {
        localInputWithRemoteRelations[remoteFieldKey] = filteredRelationInput;
      } else {
        delete localInputWithRemoteRelations[remoteFieldKey];
      }
    });
  // Create local input.
  let inputResult = pick(cuidInput, Object.keys(Object.assign({}, localFields, {
    id: true,
  })));
  // Merge with localInput
  if (localInputWithRemoteRelations) {
    inputResult = Object.assign({}, inputResult, localInputWithRemoteRelations);
  }
  return inputResult;
};
export { filterLocalInputForMutation };
