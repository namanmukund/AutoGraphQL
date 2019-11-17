// return true/false
export const ifDataExists = (fieldType, fieldValue, uniqueField, relatedModelQueries) => {
  let isValid = false;
  const searchParams = {};
  if (fieldType.isList) {
    const uniqueFieldValues = fieldValue.map((value) => value[uniqueField]);
    searchParams[uniqueField] = { $in: uniqueFieldValues };
    return relatedModelQueries.fetchMany(searchParams)
      .then((fetchedDocs) => {
        if (!fetchedDocs || !fetchedDocs.length) {
          isValid = true;
        }
        return isValid;
      });
  }

  searchParams[uniqueField] = fieldValue[uniqueField];
  return relatedModelQueries.fetchOne(searchParams)
    .then((fetchedDocs) => {
      if (!fetchedDocs || !fetchedDocs.length) {
        isValid = true;
      }
      return isValid;
    });
};
