/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import { findIndex } from 'lodash';
import { InsufficientPermissionError } from '../../../../constants/errors';
import { META } from '../../../../constants';


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
    rule === 'allow'
      && permissions
      && permissions !== '*'
      && permissions.length
  ) {
    const index = findIndex(permissions, { appName });
    if (index === -1) {
      throw new InsufficientPermissionError();
    }
    const { operations } = permissions[index];
    if (operations !== '*' && !operations.includes(operation)) {
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
      // if index exist then check for operation and if operation exist then it should be denied
      const index = findIndex(permissions, { appName });
      if (index !== -1) {
        const { operations } = permissions[index];
        if (operations === '*' || operations.includes(operation)) {
          throw new InsufficientPermissionError();
        }
      }
    }
  }

  return true;
};

const validateAllowDenyRuleOnUser = (
  userPermissions,
  appName,
  operation,
  dbRole,
) => {
  const { permissions, rule } = userPermissions;
  let flag = false;
  if (permissions && rule) {
    //  if permissions exist but db role is not available except for the default case
    if (!(permissions === '*' && rule === 'allow') && !dbRole) {
      throw new InsufficientPermissionError();
    }
    if (
      permissions !== '*'
      && permissions.length
    ) {
      // if only all the conditions are met this permission will be valid
      for (let i = 0; i < permissions.length; i += 1) {
        const { userRole, appName: allowedApps, operations } = permissions[i];
        // in case user has multiple roles defined in db
        const userRoleArray = Array.isArray(userRole) ? userRole : [userRole];
        for (let j = 0; j < userRoleArray.length; j += 1) {
          if (userRoleArray[j].includes(dbRole)) {
            if (allowedApps === '*' || allowedApps.includes(appName)) {
              if (operations === '*' || operations.includes(operation)) {
                flag = true;
                break;
              }
            }
          }
        }
      }
    } else if (permissions === '*') {
      flag = true;
    }
  }
  if ((rule === 'allow' && flag === false) || (rule === 'deny' && flag === true)) {
    throw new InsufficientPermissionError();
  }
  return true;
};

const validateAppAndUserPermission = (
  typeName,
  parsedASTMap,
  queryFields,
  authentication,
  operation,
) => {
  const { appPermissions, userPermissions, field } = parsedASTMap[typeName];
  const { app: { name: appName }, user: { role: dbRole } } = authentication;
  // app permission check on the typename level
  if (appPermissions && Object.keys(appPermissions)) {
    validateAllowDenyRuleOnApp(
      appPermissions,
      appName,
      operation,
    );
  }
  // user permission check on the typename level
  if (userPermissions && Object.keys(userPermissions)) {
    validateAllowDenyRuleOnUser(
      userPermissions,
      appName,
      operation,
      dbRole,
    );
  }
  // permission check on the fields
  const queryFieldKeys = Object.keys(queryFields);
  for (const key of queryFieldKeys) {
    // including 'result' and 'error' fields as exceptions to be sent in response like count & meta
    if (key
      && !(key.includes(META)
        || key.includes('count')
        || key.includes('result')
        || key.includes('error')
      )) {
      const { appPermissions: appPermissionsOnField } = field[key];
      if (appPermissionsOnField && Object.keys(appPermissionsOnField)) {
        validateAllowDenyRuleOnApp(
          appPermissionsOnField,
          appName,
          operation,
        );
      }
      const { userPermissions: userPermissionsOnField } = field[key];
      if (userPermissionsOnField && Object.keys(userPermissionsOnField)) {
        validateAllowDenyRuleOnUser(
          userPermissionsOnField,
          appName,
          operation,
          dbRole,
        );
      }
    }

    /* if field key is relation field then recursive strategy will be used
        to check the permission and throw error at once
   */
    if (Object.keys(parsedASTMap[typeName].relationFields)
      .includes(key)) {
      const subTypeName = parsedASTMap[typeName].field[key].type.dataType;
      validateAppAndUserPermission(
        subTypeName,
        parsedASTMap,
        queryFields[key],
        authentication,
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
  // checking for app & user permissions on type and fields and relational fields
  validateAppAndUserPermission(
    typeName,
    parsedASTMap,
    queryFields,
    authentication,
    operation,
  );
};

export default validateAppAndUserPermissionOnFields;
