const isSentryAppAndEnv = (application, env) => {
  let flag = false;
  if (application !== 'core' && (env === 'staging' || env === 'production')) {
    flag = true;
  }
  return flag;
};

export default isSentryAppAndEnv;
