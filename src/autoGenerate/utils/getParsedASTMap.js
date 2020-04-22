// returns a ast object map from types
/* In the ast returned plural keys denote arrays and singular keys denote
object maps of the arrays present in the unparsed graphql ast
examples: field : fields, argument : arguments, directive : directives
Here fields is an object map of fields array with field names as the keys of the map */
import { get } from 'lodash';
import { concatenateTypeDefs } from 'graphql-tools';
import {
  parse,
} from 'graphql';
import getParsedField from './getParsedField';
import { InvalidRuleValueError } from '../../../constants/errors';
import { allEvents } from '../../../constants/subscriptionEvents';

const getAllowedOperationsOnType = (
  definition,
  allowedDirectiveName,
) => {
  const allowedDirectiveArray = [];
  const { directives } = definition;
  if (directives && directives.length) {
    directives.forEach((directive) => {
      if (get(directive, 'name.value') === allowedDirectiveName) {
        if (get(directive, 'arguments[0].name.value') === 'list') {
          const values = get(directive, 'arguments[0].value.values');
          if (values && values.length) {
            values.forEach((listValue) => {
              const { value } = listValue;
              if (value) {
                allowedDirectiveArray.push(value);
              }
            });
          }
        }
      }
    });
  }
  return (
    (allowedDirectiveArray && allowedDirectiveArray.length)
      ? allowedDirectiveArray : '*'
  );
};

const getSubscriptionEventsOnType = (
  definition,
  allowedDirectiveName,
) => {
  const subscribedEvents = {};
  const { directives } = definition;
  if (directives && directives.length) {
    directives.forEach((directive) => {
      if (get(directive, 'name.value') === allowedDirectiveName) {
        if (get(directive, 'arguments[0].name.value') === 'events') {
          const argumentKind = get(directive, 'arguments[0].value.kind');
          if (argumentKind && argumentKind === 'ListValue') {
            const values = get(directive, 'arguments[0].value.values');
            const allowedEvents = [];
            if (values && values.length) {
              values.forEach((listValue) => {
                const { value } = listValue;
                if (value) {
                  allowedEvents.push(value);
                }
              });
              subscribedEvents.events = allowedEvents;
            }
          } else if (
            get(directive, 'arguments[0].value.value')
            && get(directive, 'arguments[0].value.value') === '*') {
            subscribedEvents.events = allEvents;
          } else {
            throw new Error('Invalid type of events assigned');
          }
        }
      }
    });
  }

  return subscribedEvents;
};

const getAppAndUserPermissionsFromDirective = (
  definition,
  permissionsRelatedDirectiveName,
) => {
  const permissionRuleObject = {};
  const permissionsArray = [];
  let rule = 'allow';
  const { directives } = definition;
  if (directives && directives.length) {
    directives.forEach((directive) => {
      // allowedDirectiveName --> appPermissions & userPermissions
      if (get(directive, 'name.value') === permissionsRelatedDirectiveName) {
        // permissions and rule arguments are required
        if (directive[arguments] && directive[arguments].length !== 2) {
          throw new Error(`Invalid arguments in ${permissionsRelatedDirectiveName} in ${definition.name.value}`);
        }
        if (
          !(get(directive, 'arguments[0].name.value') === 'permissions')
            && !(get(directive, 'arguments[1].name.value') === 'rule')
        ) {
          throw new Error(`Permission and rule arguments are required in ${permissionsRelatedDirectiveName} in ${definition.name.value}`);
        }

        const permissionValue = get(directive, 'arguments[0].value');
        const ruleValue = get(directive, 'arguments[1].value.value');

        if (['allow', 'deny'].includes(ruleValue)) {
          rule = ruleValue;
        } else {
          throw new InvalidRuleValueError();
        }

        const { kind, value, values } = permissionValue;
        if (kind === 'StringValue' && value && value === '*') {
          permissionRuleObject.permissions = value;
        } else if (kind === 'ListValue' && values && values.length) {
          values.forEach((listValue) => {
            const permissionInfoObj = {};
            const { fields } = listValue;
            if (
              !fields
              || (permissionsRelatedDirectiveName === 'userPermissions' && !(fields.length === 3))
                || (permissionsRelatedDirectiveName === 'appPermissions' && !(fields.length === 2))
            ) {
              throw new Error(`Invalid count in ${permissionsRelatedDirectiveName} in ${definition.name.value}`);
            }

            fields.forEach((field) => {
              // if it is userRole
              if (
                field.name && field.name.value === 'userRole'
                    && field.value && (field.value.value || field.value.values)
              ) {
                if (field.value.kind !== 'ListValue') {
                  permissionInfoObj.userRole = field.value.value;
                } else {
                  const userRoleArray = [];
                  field.value.values.forEach((userRole) => {
                    userRoleArray.push(userRole.value);
                  });
                  permissionInfoObj.userRole = userRoleArray;
                }
              }

              // if it is name field
              if (
                field.name && field.name.value === 'appName'
                    && field.value && (field.value.value || field.value.values)
              ) {
                if (field.value.kind === 'StringValue') {
                  permissionInfoObj.appName = field.value.value;
                } else {
                  const appNameArray = [];
                  field.value.values.forEach((appName) => {
                    appNameArray.push(appName.value);
                  });
                  permissionInfoObj.appName = appNameArray;
                }
              }
              // if it is operations field
              if (
                field.name && field.name.value === 'operations'

              ) {
                // if operations is an array
                if (field.value && field.value.values && field.value.values.length) {
                  const operationsArray = [];
                  field.value.values.forEach((operation) => {
                    operationsArray.push(operation.value);
                  });
                  permissionInfoObj.operations = operationsArray;
                } else if (field.value.value === '*') {
                  permissionInfoObj.operations = '*';
                } else {
                  throw new Error(`Invalid operation field format  in ${permissionsRelatedDirectiveName} in ${definition.name.value}`);
                }
              }
            });
            if (permissionInfoObj) {
              permissionsArray.push(permissionInfoObj);
            }
          });
        } else {
          throw new Error(`Invalid permission format in ${permissionsRelatedDirectiveName} in ${definition.name.value}`);
        }
      }
    });
  }
  if (permissionsArray && permissionsArray.length) {
    permissionRuleObject.permissions = permissionsArray;
  } else {
    permissionRuleObject.permissions = '*';
  }
  permissionRuleObject.rule = rule;
  return permissionRuleObject;
};
const getParsedASTMap = (graphqlSchemaTypes) => {
  const initialAST = parse(concatenateTypeDefs(graphqlSchemaTypes));
  /*
  Definitions can be ObjectTypeDefinition, InputObjectTypeDefinition, EnumTypeDefinition
  and contains other graphql properties like directives, fields, interfaces, and typeName
   */
  const { definitions } = initialAST;
  // To store final parsed AST Object.
  const parsedASTObject = {};
  definitions.forEach((definition) => {
    const { kind, fields, ...props } = definition;
    // not making type ast for graphql input types(remove check if input types ast required)
    if (kind !== 'ObjectTypeDefinition' || !fields || !fields.length) {
      return null;
    }
    // on typeName level
    const appPermissions = getAppAndUserPermissionsFromDirective(
      definition,
      'appPermissions',
    );
    // on typeName level
    const userPermissions = getAppAndUserPermissionsFromDirective(
      definition,
      'userPermissions',
    );
    // on typeName level
    const allowedOperations = getAllowedOperationsOnType(
      definition,
      'allowedOperations',
    );

    const subscribe = getSubscriptionEventsOnType(
      definition,
      'subscribe',
    );
    // To store fields Object for each field.
    const fieldsObject = {};
    // To Store all relation fields.
    const relationFields = {};
    // To Store local fields.
    const localFields = {};
    // To Store local fields, with relation directive
    const localRelationFields = {};
    // To Store local subset fields, with isSubset directive
    const localSubsetFields = [];
    // To Store additional relation fields
    const additionalRelationFields = {};
    // To Store local non null
    const localNonNullFields = {};
    // To Store local fields, with unique directive
    const localUniqueFields = {};
    // To Store non null fields with unique directive
    const localNonNullAndUniqueFields = {};
    // To store remote fields.
    const remoteFields = {};
    // To Store remote fields, with relation directive
    const remoteRelationFields = {};
    // To store remote fields, per application.
    const remoteFieldsApplicationWise = {};
    // To Store remote fields, with relation directive, per application
    const remoteRelationFieldsApplicationWise = {};
    // To store remote fields which are non null, per application
    const remoteNonNullFieldsApplicationWise = {};
    // To store remote fields which have remote directive, per application
    const remoteUniqueFieldsApplicationWise = {};
    // To store remote fields which are not null, and have unique directive, per application
    const remoteNonNullAndUniqueFieldsApplicationWise = {};
    // To store readOnly access fields
    const readOnlyFields = [];
    // To store writeOnly access fields
    const writeOnlyFields = [];
    // To store defaultFields
    const defaultFields = [];
    // To store defaultFields Value
    const defaultFieldsWithValue = {};

    fields.forEach((fieldDefinition) => {
      // field type should be fieldDefinition
      if (fieldDefinition.kind !== 'FieldDefinition') {
        return null;
      }
      const fieldName = fieldDefinition.name.value;
      const parsedField = getParsedField(fieldDefinition);
      // To store field directives as object per field.
      const directivesObject = {};
      const isNonNull = parsedField.type && parsedField.type.isNonNull;
      let isRemote = false;
      let isUnique = false;
      let isRelation = false;
      let remoteApplicationValue = null;
      /*
      Collecting all the directives
       */
      if (parsedField.directives.length > 0) {
        parsedField.directives.forEach((directive) => {
          const directivesMap = { ...directive };
          const directiveName = directive.name.value;
          const directiveArguments = directive.arguments;
          if (directiveName === 'defaultValue') {
            defaultFieldsWithValue[fieldName] = directiveArguments[0].value.value;
          }
          const argsObject = {};
          // Convert directiveArguments into Object.
          directiveArguments.forEach((arg) => {
            const argumentName = arg.name.value;
            argsObject[argumentName] = arg;
          });
          directivesMap.argument = argsObject; // Object of arguments.
          directivesObject[directiveName] = directivesMap;
          // If directive is remote, add to remoteFields
          switch (directiveName) {
            case 'remote':
              isRemote = true;
              remoteFields[fieldName] = remoteFields[fieldName] || {};
              // Storing directive arguments as object.
              directiveArguments.forEach((directiveArgument) => {
                const directiveArgumentName = directiveArgument.name.value;
                const directiveArgumentValue = directiveArgument.value.value;
                argsObject[directiveArgument] = directiveArgument;
                remoteFields[fieldName][directiveArgumentName] = directiveArgumentValue;
                // If directive remote name is set.
                if (directiveArgumentName === 'name') {
                  remoteApplicationValue = directiveArgumentValue;
                }
              });
              break;

            case 'unique':
            case 'uniqueOrEmpty':
              isUnique = true;
              break;

            case 'relation':
              isRelation = true;
              // add additional relation fields to additionalRelationFields object.
              // in the format- fieldName: {relationFieldName: relationTypeName}
              directiveArguments.forEach((directiveArgument) => {
                const directiveArgumentName = directiveArgument.name.value;
                if (directiveArgumentName === 'fields') {
                  additionalRelationFields[fieldName] = additionalRelationFields[fieldName] || {};
                  const argumentFields = directiveArgument.value.fields;
                  argumentFields.forEach((relationField) => {
                    const relationFieldName = relationField.name.value;
                    const isFieldListKind = relationField.value.kind === 'ListValue';
                    const fieldType = isFieldListKind ? relationField.value.values[0].value
                      : relationField.value.value;
                    let fieldTypeString;
                    if (isFieldListKind) {
                      fieldTypeString = `[${fieldType}]`;
                    } else {
                      fieldTypeString = `${fieldType}`;
                    }
                    additionalRelationFields[fieldName][relationFieldName] = fieldTypeString;
                  });
                } else if (directiveArgumentName === 'isSubset') {
                  const isSubset = directiveArgument.value.value === true;
                  if (isSubset) {
                    localSubsetFields.push(fieldName);
                  }
                }
              });
              break;

            case 'readOnly':
              readOnlyFields.push(fieldName);
              break;

            case 'writeOnly':
              writeOnlyFields.push(fieldName);
              break;
            case 'defaultValue':
              defaultFields.push(fieldName);
              break;

            case 'appPermissions':
              parsedField.appPermissions = getAppAndUserPermissionsFromDirective(
                { directives: parsedField.directives },
                'appPermissions',
              );
              break;

            case 'userPermissions':
              parsedField.userPermissions = getAppAndUserPermissionsFromDirective(
                { directives: parsedField.directives },
                'userPermissions',
              );
              break;

            default:
            // Do nothing.
          }
        });
      }
      if (!isRemote) {
        localFields[fieldName] = true;
        // If isRelation
        if (isRelation) {
          const directiveName = directivesObject.relation.argument.name.value.value;
          localRelationFields[fieldName] = directiveName;
          relationFields[fieldName] = directiveName;
        }
        // If isUnique
        if (isUnique) {
          localUniqueFields[fieldName] = true;
        }
        // If nonNull
        if (isNonNull) {
          localNonNullFields[fieldName] = true;
        }
        // If nonNull && Ubique
        if (isNonNull && isUnique) {
          localNonNullAndUniqueFields[fieldName] = true;
        }
      } else if (remoteApplicationValue) {
        remoteFieldsApplicationWise[remoteApplicationValue] = remoteFieldsApplicationWise[remoteApplicationValue] || {};
        remoteFieldsApplicationWise[remoteApplicationValue][fieldName] = true;

        // If isRelation
        if (isRelation) {
          const directiveName = directivesObject.relation.argument.name.value.value;
          const fieldType = parsedField.type.dataType;
          remoteRelationFields[fieldName] = {
            type: fieldType,
            relationName: directiveName,
          };
          relationFields[fieldName] = directiveName;
          remoteRelationFieldsApplicationWise[remoteApplicationValue] = remoteRelationFieldsApplicationWise[remoteApplicationValue] || {};
          remoteRelationFieldsApplicationWise[remoteApplicationValue][fieldName] = true;
        }
        // If isUnique
        if (isUnique) {
          remoteUniqueFieldsApplicationWise[remoteApplicationValue] = remoteUniqueFieldsApplicationWise[remoteApplicationValue] || {};
          remoteUniqueFieldsApplicationWise[remoteApplicationValue][fieldName] = true;
        }
        // If nonNull
        if (isNonNull) {
          remoteNonNullFieldsApplicationWise[remoteApplicationValue] = remoteNonNullFieldsApplicationWise[remoteApplicationValue] || {};
          remoteNonNullFieldsApplicationWise[remoteApplicationValue][fieldName] = true;
        }
        // If nonNull && Unique
        if (isNonNull && isUnique) {
          remoteNonNullAndUniqueFieldsApplicationWise[remoteApplicationValue] = remoteNonNullAndUniqueFieldsApplicationWise[remoteApplicationValue] || {};
          remoteNonNullAndUniqueFieldsApplicationWise[remoteApplicationValue][fieldName] = true;
        }
      }
      parsedField.directive = directivesObject; // this is object of directives.

      fieldsObject[fieldName] = parsedField;
      return null;
    });
    let fieldsParsedArray = fields.map((fieldDefinition) => {
      if (fieldDefinition.kind === 'FieldDefinition') {
        return getParsedField(fieldDefinition);
      }
      return null;
    });
    // remove nulls
    fieldsParsedArray = fieldsParsedArray.filter((field) => field);
    const name = definition.name.value;

    parsedASTObject[name] = {
      ...props,
      fields: fieldsParsedArray, // this is array of fields
      field: fieldsObject, // this is object of fields
      kind,
      localFields,
      relationFields,
      localRelationFields,
      localSubsetFields,
      readOnlyFields,
      writeOnlyFields,
      defaultFields,
      localUniqueFields,
      localNonNullFields,
      localNonNullAndUniqueFields,
      remoteFields,
      remoteRelationFields,
      remoteFieldsApplicationWise,
      remoteRelationFieldsApplicationWise,
      remoteUniqueFieldsApplicationWise,
      remoteNonNullFieldsApplicationWise,
      remoteNonNullAndUniqueFieldsApplicationWise,
      defaultFieldsWithValue,
      additionalRelationFields,
      appPermissions,
      userPermissions,
      allowedOperations,
      subscribe,
    };

    return null;
  });

  return parsedASTObject;
};

export default getParsedASTMap;
