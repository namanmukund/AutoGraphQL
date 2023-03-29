const isAPMEnabledAppAndEnv = () => {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    return true;
  }
  return false;
};

export default isAPMEnabledAppAndEnv;
