const isAPMEnabledAppAndEnv = () => {
  if (process.env.NODE_ENV === 'production') {
    return true;
  }
  return false;
};

export default isAPMEnabledAppAndEnv;
