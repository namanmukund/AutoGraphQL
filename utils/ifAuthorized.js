/* eslint-disable no-console */
import { get } from 'lodash';
import { MENTOR } from '../constants/roles';

export const authenticateUser = (context, userToken) => {
  if (get(userToken, 'isRequired') === 'false' || get(userToken, 'isRequired') === false) {
    return true;
  }
  if (context && context.currentUser && (
    (context.currentUser.id && context.currentUser.status) || context.currentUser === true)) {
    return context.currentUser;
  }
  return false;
};

export const authenticateApp = (context) => {
  if (context && context.currentApp && (context.currentApp.name || context.currentApp === true)) {
    return context.currentApp;
  }
  return false;
};

// custom function built for a specific functionality
export const authenticateMentor = (context) => {
  if (context && context.currentMentor
    && ((
      context.currentMentor.id
      && context.currentMentor.role
      && context.currentMentor.role === MENTOR
      && context.currentMentor.status
      && context.currentMentor.status === 'active')
      || context.currentMentor === true)) {
    return context.currentMentor;
  }
  return false;
};

export const ifAuthorized = (context, userToken) => {
  const app = authenticateApp(context);
  const user = authenticateUser(context, userToken);
  const mentor = authenticateMentor(context);
  console.log('user from inside', user);
  const obj = {};
  // no need to show mentor tag inn context if it has no value
  if (mentor) {
    obj.mentor = mentor;
  }
  obj.app = app;
  obj.user = user;
  return obj;
};
