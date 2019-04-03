/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import { findIndex } from 'lodash';
import { InsufficientPermissionError } from '../../../../constants/errors';


const validateAllowDenyRuleOnApp = (
  appPermissions,
  appName,
  operation,
) => {
  const { permissions, rule } = appPermissions;

  /*
  If rule is allow then check for all the permitted apps and their operations
   */
  if (
    rule === 'allow' &&
      permissions &&
      permissions !== '*' &&
      permissions.length
  ) {
    const index = findIndex(permissions, { appName });
    if (index === -1) {
      throw new InsufficientPermissionError();
    }
    const { operations } = permissions[index];
    if (!operations.includes(operation)) {
      throw new InsufficientPermissionError();
    }
  }

  /*
 If rule is deny then check for all the permitted apps and their operations
  */
  if (
    rule === 'deny'
  ) {
    // block all
    if (permissions && permissions === '*') {
      throw new InsufficientPermissionError();
    } else if (permissions && permissions.length) {
      // if index exist then check for operation and operation exist then it should be denied
      const index = findIndex(permissions, { appName });
      if (index !== -1) {
        const { operations } = permissions[index];
        if (operations.includes(operation)) {
          throw new InsufficientPermissionError();
        }
      }
    }
  }

  return true;
};

const validateAppPermission = (
  typeName,
  parsedASTMap,
  queryFields,
  authentication,
  operation,
) => {
  const { appPermissions, field } = parsedASTMap[typeName];
  const { app: { name: appName } } = authentication;
  // on the typename level
  if (appPermissions && Object.keys(appPermissions)) {
    validateAllowDenyRuleOnApp(
      appPermissions,
      appName,
      operation,
    );
  }

  // on the fields
  const queryFieldKeys = Object.keys(queryFields);
  for (const key of queryFieldKeys) {
    const { appPermissions: appPermissionsOnField } = field[key];
    if (appPermissionsOnField && Object.keys(appPermissionsOnField)) {
      validateAllowDenyRuleOnApp(
        appPermissionsOnField,
        appName,
        operation,
      );
    }
  }
  return true;
};


const validateAppAndUserPermissionOnFields = (
  typeName,
  parsedASTMap,
  queryFields,
  authentication,
  operation,
) => {
  validateAppPermission(
    typeName,
    parsedASTMap,
    queryFields,
    authentication,
    operation,
  );
};

export default validateAppAndUserPermissionOnFields;
