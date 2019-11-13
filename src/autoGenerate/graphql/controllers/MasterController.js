import models from '../../models';
import * as permissionFunctions from '../permissions';
import {
  UnauthenticatedUserError, UnauthenticatedAppError, UnauthorizedOperationError,
  InvalidStaticToken,
} from '../../../../constants/errors';
import { STATIC, shortAppName, graphQlOperations } from '../../../../constants';
import { isBackendApp, isFrontEndApp, isPermissionIntegratedApp } from '../validation';
import { QueryController } from './index';

class MasterController {
  constructor(model, authentication) {
    this.modelName = model;
    this.Model = model && models[model];
    this.bypass = authentication && authentication.bypass;
    this.app = authentication && authentication.app;
    this.user = authentication && authentication.user;
    this.mutationOrQueryName = authentication && authentication.mutationOrQueryName;
    this.authentication = authentication;
    this.apiType = this.getApiType(authentication);
  }

  validate() {
    // Return true if bypass.
    if (this.bypass) {
      return true;
    }
    // Allow if any of the backend applications.
    if (this.app) {
      // if app token type is static then verify if the token is valid or not
      const { type, isValidStaticToken } = this.app;
      if (type && type === STATIC && !isValidStaticToken) {
        throw new InvalidStaticToken();
      }
      // Allow if backend app.
      if (isBackendApp(this.authentication)) {
        return true;
      }
      // If a front end app, throw error if front end app is not allowed.
      if (!isFrontEndApp(this.authentication)) {
        throw new UnauthenticatedAppError();
      }
    } else {
      throw new UnauthenticatedAppError();
    }
    // validate user.
    if (!this.user) {
      throw new UnauthenticatedUserError();
    }
    return true;
  }

  validateStatus() {
    if (this.user && this.user.status) {
      const { status } = this.user;
      switch (status) {
        case 'inactive':
        case 'blocked':
          throw new UnauthorizedOperationError();
        default:
      }
    }
  }

  isPermissionValidationRequired() {
    // Allow without permission if bypass.
    if (this.bypass) {
      return false;
    }
    // Allow without permission if backend app.
    if (isBackendApp(this.authentication)) {
      return false;
    }
    // Allow without permission if it is a frontend app where permission is not yet integrated
    if (!isPermissionIntegratedApp(this.authentication)) {
      return false;
    }
    // Allow without permission for requests from login, signup, signupExistingUser, etc. mutations
    if (this.user === true) {
      return false;
    }
    return true;
  }

  // Returns a promise which resolves to whether the action is permitted or not
  // Accepts a args object containing target related parameters
  // Accepts a checkStatus boolean to check whether to validate user status or not
  validatePermissions(args, checkStatus) {
    // Validate app
    this.validate();
    // Validate user status
    if (checkStatus) {
      this.validateStatus();
    }
    // Validate whether permission check is required or not
    /* Validate will return false if bypass is set or
    if it is backend app or it is frontend app where permission is not yet integrated
     (No permission check is required then) */
    if (!this.isPermissionValidationRequired()) {
      return Promise.resolve({ status: true });
    }
    // Permission denied if there is no data for user and its roles
    if (!this.user.roles || !this.user.roles.length) {
      return Promise.resolve({ status: false, data: 'User roles not found' });
    }

    // Permission allowed - Run mapped permission query functions
    return this.validateMappedPermissionFunctions(args);
  }

  // Returns whether permission through permission query functions is allowed or not
  // Runs all permission query functions parallely
  // Accepts a args object containing target related parameters
  validateMappedPermissionFunctions(args) {
    // Get permission query function name for given role
    const permisssionQueryFunctionName = this.extractPermissionQueryFunctionName();
    // Check if permission query functions are defined for current scenario
    if (typeof permissionFunctions[permisssionQueryFunctionName] === 'function') {
      const fn = permissionFunctions[permisssionQueryFunctionName];
      // Call our permission query functions
      return fn(this.user.id, this.modelName, this.app,
        this.user.roles, this.mutationOrQueryName, args);
    }
    return Promise.resolve({ status: false });
  }

  // get API type whether query or mutation
  getApiType(authentication) {
    // This is a better way of getting type, as we set type explicitly.
    if (authentication && authentication.mutationOrQuery) {
      return authentication.mutationOrQuery;
    }
    // If "mutationOrQuery" is not set, then check instance.
    return this instanceof QueryController ? graphQlOperations.query : graphQlOperations.mutation;
  }

  extractPermissionQueryFunctionName() {
    const appName = this.app.name;
    return `${shortAppName[appName]}_${this.apiType}_${this.mutationOrQueryName}`;
  }
}
export default MasterController;
