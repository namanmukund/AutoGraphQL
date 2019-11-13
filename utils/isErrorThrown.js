export default (errorObject) => {
  if (errorObject) {
    //  apollo-error, mongo error
    if (errorObject instanceof Error || errorObject.time_thrown || errorObject.errmsg) {
      return true;
    }
    return false;
  }
  return false;
};
