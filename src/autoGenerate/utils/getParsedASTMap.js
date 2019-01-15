// returns a ast object map from types
/* In the ast returned plural keys denote arrays and singular keys denote
object maps of the arrays present in the unparsed graphql ast
examples: field : fields, argument : arguments, directive : directives
Here fields is an object map of fields array with field names as the keys of the map */
import { concatenateTypeDefs } from 'graphql-tools';
import {
  parse,
} from 'graphql';
import getParsedField from './getParsedField';

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
          const directivesMap = Object.assign({}, directive);
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
                    const fieldType = isFieldListKind ? relationField.value.values[0].value :
                      relationField.value.value;
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
        remoteFieldsApplicationWise[remoteApplicationValue] =
          remoteFieldsApplicationWise[remoteApplicationValue] || {};
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
          remoteRelationFieldsApplicationWise[remoteApplicationValue] =
            remoteRelationFieldsApplicationWise[remoteApplicationValue] || {};
          remoteRelationFieldsApplicationWise[remoteApplicationValue][fieldName] = true;
        }
        // If isUnique
        if (isUnique) {
          remoteUniqueFieldsApplicationWise[remoteApplicationValue] =
            remoteUniqueFieldsApplicationWise[remoteApplicationValue] || {};
          remoteUniqueFieldsApplicationWise[remoteApplicationValue][fieldName] = true;
        }
        // If nonNull
        if (isNonNull) {
          remoteNonNullFieldsApplicationWise[remoteApplicationValue] =
            remoteNonNullFieldsApplicationWise[remoteApplicationValue] || {};
          remoteNonNullFieldsApplicationWise[remoteApplicationValue][fieldName] = true;
        }
        // If nonNull && Unique
        if (isNonNull && isUnique) {
          remoteNonNullAndUniqueFieldsApplicationWise[remoteApplicationValue] =
            remoteNonNullAndUniqueFieldsApplicationWise[remoteApplicationValue] || {};
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
    fieldsParsedArray = fieldsParsedArray.filter(field => field);
    const name = definition.name.value;

    parsedASTObject[name] = Object.assign({}, props, {
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
    });

    return null;
  });

  return parsedASTObject;
};

export default getParsedASTMap;
