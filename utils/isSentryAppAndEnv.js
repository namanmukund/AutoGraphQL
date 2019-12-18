const isSentryAppAndEnv = (application, env) => {
  let flag = false;
  if (env === 'development' || env === 'staging' || env === 'production') {
    flag = true;
  }
  return flag;
};

export default isSentryAppAndEnv;
