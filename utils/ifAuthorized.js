export const authenticateUser = (context) => {
  if (context && context.decodedUser && (context.decodedUser.id || context.decodedUser === true)) {
    return context.decodedUser;
  }
  return false;
};

export const authenticateApp = (context) => {
  if (context && context.decodedApp && (context.decodedApp.name || context.decodedApp === true)) {
    return context.decodedApp;
  }
  return false;
};

export const ifAuthorized = (context) => {
  const app = authenticateApp(context);
  const user = authenticateUser(context);
  return {
    app,
    user,
  };
};
