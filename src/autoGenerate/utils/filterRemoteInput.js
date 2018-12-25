import { pick } from 'lodash';

// Given an input,
// this function filters out only remote input recursively.
const filterRemoteInput = (
  typeName,
  appApplicationName,
  ast,
  input,
) => {
  const thisAst = ast[typeName];
  const { remoteRelationFields, remoteFieldsApplicationWise } = thisAst;
  const remoteKeys = Object.keys(remoteFieldsApplicationWise[appApplicationName]);
  const remoteInput = pick(input, remoteKeys);
  Object.keys(remoteInput)
    .forEach((key) => {
      if (remoteRelationFields && remoteRelationFields[key]) {
        // When field is remote relaton field.
        const remoteRemoteInput = remoteInput[key];
        // If relation input is array.
        if (Array.isArray(remoteRemoteInput)) {
          remoteInput[key] = remoteRemoteInput.map(value => filterRemoteInput(
            remoteRelationFields[key].type,
            appApplicationName,
            ast,
            value,
          ));
        } else {
          // If relation input is single object.
          remoteInput[key] = filterRemoteInput(
            remoteRelationFields[key].type,
            appApplicationName,
            ast,
            remoteRemoteInput,
          );
        }
      }
    });
  return remoteInput;
};

export default filterRemoteInput;
