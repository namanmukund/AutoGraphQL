const filterRemotePayload = (
  typeName,
  typeField,
  relatedType,
  relatedTypeField,
  appApplicationName,
  ast,
  feildsFetched,
) => {
  const filteredFeildsFetched = feildsFetched;
  Object.keys(feildsFetched)
    .forEach((fieldKey) => {
      const type = fieldKey.endsWith(typeName) ? typeName : relatedType;
      Object.keys(feildsFetched[fieldKey])
        .forEach((subFieldKey) => {
          if (subFieldKey === 'id') {
            return;
          }
          // If subfield is not a remote field, then remove
          const { remoteFieldsApplicationWise } = ast[type];
          if (!remoteFieldsApplicationWise[appApplicationName][subFieldKey]) {
            delete filteredFeildsFetched[fieldKey][subFieldKey];
          }
        });
    });
  return filteredFeildsFetched;
};

export default filterRemotePayload;
