// this function will output the related field name
export const getRelatedFieldName = (relationType, relationName) => {
  let relatedFieldName;
  Object.keys(relationType)
    .every((singleRelationName) => {
      if (relationType[singleRelationName] === relationName) {
        relatedFieldName = singleRelationName;
        return false;
      }
      return true;
    });
  return relatedFieldName;
};
