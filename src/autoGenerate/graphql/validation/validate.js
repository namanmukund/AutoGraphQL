import { includes } from 'lodash';
import {
  backendApps, frontEndApps, defaultFields, operationName,
  permissionIntegratedApps,
} from '../../../../constants';
import {
  InvalidReadAccessError, InvalidWriteAccessError,
  InvalidActionOnDefaultFieldsError,
} from '../../../../constants/errors';

const isBackendApp = (authentication) => {
  const app = authentication && authentication.app;
  const decodedApp = authentication && authentication.decodedApp;
  let flag = false;
  if (app) {
    const appName = app && app.name;
    if (backendApps.includes(appName)) {
      flag = true;
    }
  } else if (decodedApp) {
    const appName = decodedApp && decodedApp.name;
    if (backendApps.includes(appName)) {
      flag = true;
    }
  }
  return flag;
};

const isFrontEndApp = (authentication) => {
  const app = authentication && authentication.app;
  let flag = false;
  if (app) {
    const appName = app && app.name;
    if (frontEndApps.indexOf(appName) >= 0) {
      flag = true;
    }
  }
  return flag;
};
// Check whether permission is integrated in this frontend app
const isPermissionIntegratedApp = (authentication) => {
  const app = authentication && authentication.app;
  let flag = false;
  if (app) {
    const appName = app && app.name;
    if (permissionIntegratedApps.includes(appName)) {
      flag = true;
    }
  }
  return flag;
};

/*
validateAccess checks if writeOnly is not passed as queryFields and also checks
if readOnly fields are not set as input
*/
const validateAccess = (unauthorizedFields, queryFields) => {
  const queryFieldsArray = Object.keys(queryFields);
  if (unauthorizedFields && unauthorizedFields.length) {
    for (let i = 0; i < unauthorizedFields.length; i += 1) {
      if (includes(queryFieldsArray, unauthorizedFields[i])) {
        return false;
      }
    }
  }
  return true;
};
/*
  validate if user tries to set default input like id, createdAt, updatedAt
*/
const validateDefaultInput = (input) => {
  const inputArray = Object.keys(input);
  for (let i = 0; i < inputArray.length; i += 1) {
    if (includes(defaultFields, inputArray[i])) {
      return false;
    }
  }
  return true;
};

const validate = (operation, accessFields, queryFields, authentication, input) => {
  if (isBackendApp(authentication)) {
    return true;
  }

  if (operation === operationName.read || operation === operationName.delete) {
    // check if user is not trying to fetch writeOnly fields
    const validAccess = validateAccess(
      accessFields.writeOnlyFields,
      queryFields,
    );
    if (!validAccess) {
      throw new InvalidReadAccessError();
    }
  } else if (operation === operationName.add || operation === operationName.update) {
    // check if user is not trying to add readOnly fields
    const writeValidation = validateAccess(
      accessFields.readOnlyFields,
      input,
    );

    if (!writeValidation) {
      throw new InvalidWriteAccessError();
    }
    // check if user is not trying to fetch writeOnly fields
    const readValidation = validateAccess(
      accessFields.writeOnlyFields,
      queryFields,
    );
    if (!readValidation) {
      throw new InvalidReadAccessError();
    }
    if (input) {
      const validateDefaultFieldsInput = validateDefaultInput(input);
      if (!validateDefaultFieldsInput) {
        throw new InvalidActionOnDefaultFieldsError();
      }
    }

    return true;
  }
  return false;
};

export { validate, isBackendApp, isFrontEndApp, isPermissionIntegratedApp };
