const getFlatArrayForFields = (fieldsFetched, prefix = '') => {
  let newKeys = [];
  return Object.entries(fieldsFetched).reduce((collector, [key, val]) => {
    newKeys = [...collector, prefix ? `${prefix}.${key}` : key];
    if (Object.prototype.toString.call(val) === '[object Object]') {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      const otherKeys = getFlatArrayForFields(val, newPrefix);
      return [...newKeys, ...otherKeys];
    }
    return newKeys;
  }, []);
};

export const validateIncomingFields = async (fieldsFetched = {}, allowedFields = []) => {
  const fieldsFetchedArr = getFlatArrayForFields(fieldsFetched);
  let inValid = false;
  if (fieldsFetchedArr && fieldsFetchedArr.length) {
    for (let i = 0; i < fieldsFetchedArr.length; i += 1) {
      if (!allowedFields.includes(fieldsFetchedArr[i])) {
        inValid = true;
        break;
      }
    }
  }
  return inValid;
};

export default getFlatArrayForFields;
