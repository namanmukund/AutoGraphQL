/* eslint-disable no-param-reassign */
const convertObjectFieldsToStrings = (fieldsFetched, stringFieldsObj = { str: '' }) => {
  Object.keys(fieldsFetched).forEach((key) => {
    stringFieldsObj.str += `${key} `;
    if (typeof fieldsFetched[key] === 'object') {
      stringFieldsObj.str += '{ ';
      convertObjectFieldsToStrings(fieldsFetched[key], stringFieldsObj);
      stringFieldsObj.str += '} ';
    }
  });
  return stringFieldsObj;
};

export default convertObjectFieldsToStrings;
