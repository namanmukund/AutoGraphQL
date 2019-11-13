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
  const { remoteRelationFields } = ast[typeName];
  const localInputWithRemoteRelations = pick(inputWithRemotevalues, Object.keys(remoteRelationFields));
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
            const keysArray = Object.keys({ ...relationLocalFields, id: true });
            const finalRelationInput = pick(relationInputValue, keysArray);
            return finalRelationInput;
          });
        }
      } else if (relationInput) {
        filteredRelationInput = pick(relationInput, Object.keys(
          { ...relationLocalFields, id: true },
        ));
      }
      if (filteredRelationInput) {
        localInputWithRemoteRelations[remoteFieldKey] = filteredRelationInput;
      } else {
        delete localInputWithRemoteRelations[remoteFieldKey];
      }
    });
  // Create local input.
  let inputResult = pick(cuidInput, Object.keys({ ...localFields, id: true }));
  // Merge with localInput
  if (localInputWithRemoteRelations) {
    inputResult = { ...inputResult, ...localInputWithRemoteRelations };
  }
  return inputResult;
};
export { filterLocalInputForMutation };
