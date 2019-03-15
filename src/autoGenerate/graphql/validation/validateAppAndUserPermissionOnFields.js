/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import { UnauthorizedFieldOrTypeAccessByAppError } from '../../../../constants/errors';


const validateAppAndUserPermissionOnFields = (
  typeName,
  parsedASTMap,
  queryFields,
  authentication,
) => {
  const { allowedApps, field } = parsedASTMap[typeName];
  const { app: { name: appName } } = authentication;
  // on the typename level
  if (
    allowedApps &&
        allowedApps !== 'all' &&
        allowedApps.length &&
        !allowedApps.includes(appName)
  ) {
    throw new UnauthorizedFieldOrTypeAccessByAppError(
      {
        data: {
          typeName,
        },
      },
    );
  }
  // on the fields
  const queryFieldKeys = Object.keys(queryFields);
  for (const key of queryFieldKeys) {
    const { allowedApps: allowedAppsOnField } = field[key];
    if (
      allowedAppsOnField &&
            allowedAppsOnField !== 'all' &&
            allowedAppsOnField.length &&
        !allowedAppsOnField.includes(appName)
    ) {
      throw new UnauthorizedFieldOrTypeAccessByAppError(
        {
          data: {
            typeName,
            fieldName: key,
          },
        },
      );
    }
  }
  return true;
};

export default validateAppAndUserPermissionOnFields;
