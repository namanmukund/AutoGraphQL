const isSentryAppAndEnv = () => {
  if (process.env.NODE_ENV === 'production') {
    return true;
  }
  return false;
};

export default isSentryAppAndEnv;
