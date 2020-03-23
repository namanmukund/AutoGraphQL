let updateToString = '';
const convertObjectFieldsToStrings = (fieldsFetched) => {
  if (Object.keys(fieldsFetched).length) {
    Object.keys(fieldsFetched).map((key) => {
      updateToString += `${key} `;
      if (Object.keys(fieldsFetched[key]).length) {
        updateToString += '{ ';
        convertObjectFieldsToStrings(fieldsFetched[key], updateToString);
        updateToString += '} ';
      }
      return null;
    });
  }
  return updateToString;
};


export default convertObjectFieldsToStrings;
