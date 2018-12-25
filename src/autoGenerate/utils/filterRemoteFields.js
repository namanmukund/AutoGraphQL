import { pick } from 'lodash';

// Given a list of fields,
// this function filters out only remote fields recursively.
const filterRemoteFields = (
  typeName,
  appApplicationName,
  ast,
  feildsFetched,
) => {
  const thisAst = ast[typeName];
  const { remoteRelationFields, remoteFieldsApplicationWise } = thisAst;
  const remoteFieldFetchKeys = Object.keys(remoteFieldsApplicationWise[appApplicationName]);
  const relationFetchFields = pick(feildsFetched, remoteFieldFetchKeys);
  // Add id field.
  relationFetchFields.id = true;
  Object.keys(relationFetchFields)
    .forEach((key) => {
      if (remoteRelationFields && remoteRelationFields[key]) {
        // When field is remote relaton field.
        relationFetchFields[key] = filterRemoteFields(
          remoteRelationFields[key].type,
          appApplicationName,
          ast,
          relationFetchFields[key],
        );
      }
    });
  return relationFetchFields;
};

export default filterRemoteFields;
