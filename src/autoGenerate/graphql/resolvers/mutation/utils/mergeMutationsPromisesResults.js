const mergeMutationsPromisesResults = (values) => {
  let returnObject = null;
  if (values && values.length > 0) {
    values.map((value) => {
      returnObject = value && Object.assign({}, returnObject, value);
      return null;
    });
  }
  return returnObject;
};
export { mergeMutationsPromisesResults };
