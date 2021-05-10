const isSentryAppAndEnv = () => {
  if (process.env.NODE_ENV === 'production' && process.env.IS_SCHEDULER_INSTANCE === 'true') {
    return true;
  }
  return false;
};

export default isSentryAppAndEnv;
