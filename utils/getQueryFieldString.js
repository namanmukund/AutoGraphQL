import { trimEnd } from 'lodash';

const getQueryFieldString = (fields) => {
  const fieldString = (JSON.stringify(fields)).replace(/"/g, ' ').replace(/true/g, ' ').replace(/:/g, ' ');
  const fieldsToQuery = trimEnd(fieldString, '"');
  return fieldsToQuery;
};

export default getQueryFieldString;
