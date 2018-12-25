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

const getParsedASTMap = (schematypes) => {
  const initialAST = parse(concatenateTypeDefs(schematypes));
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
      const fieldname = fieldDefinition.name.value;
      const parsedField = getParsedField(fieldDefinition);
      // To store field directives as object per field.
      const directivesObject = {};
      const isNonNull = parsedField.type && parsedField.type.isNonNull;
      let isRemote = false;
      let isUnique = false;
      let isRelation = false;
      let remoteApplicaitonValue = null;
      if (parsedField.directives.length > 0) {
        parsedField.directives.forEach((directive) => {
          const directivesMap = Object.assign({}, directive);
          const directiveName = directive.name.value;
          const directiveArguments = directive.arguments;
          if (directiveName === 'defaultValue') {
            defaultFieldsWithValue[fieldname] = directiveArguments[0].value.value;
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
              remoteFields[fieldname] = remoteFields[fieldname] || {};
              // Storing directive arguments as object.
              directiveArguments.forEach((directiveArgument) => {
                const directiveArgumentName = directiveArgument.name.value;
                const directiveArgumentValue = directiveArgument.value.value;
                argsObject[directiveArgument] = directiveArgument;
                remoteFields[fieldname][directiveArgumentName] = directiveArgumentValue;
                // If directive remote name is set.
                if (directiveArgumentName === 'name') {
                  remoteApplicaitonValue = directiveArgumentValue;
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
                  additionalRelationFields[fieldname] = additionalRelationFields[fieldname] || {};
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
                    additionalRelationFields[fieldname][relationFieldName] = fieldTypeString;
                  });
                } else if (directiveArgumentName === 'isSubset') {
                  const isSubset = directiveArgument.value.value === true;
                  if (isSubset) {
                    localSubsetFields.push(fieldname);
                  }
                }
              });
              break;

            case 'readOnly':
              readOnlyFields.push(fieldname);
              break;

            case 'writeOnly':
              writeOnlyFields.push(fieldname);
              break;
            case 'defaultValue':
              defaultFields.push(fieldname);
              break;

            default:
            // Do nothing.
          }
        });
      }
      if (!isRemote) {
        localFields[fieldname] = true;
        // If isRelation
        if (isRelation) {
          const directiveName = directivesObject.relation.argument.name.value.value;
          localRelationFields[fieldname] = directiveName;
          relationFields[fieldname] = directiveName;
        }
        // If isUnique
        if (isUnique) {
          localUniqueFields[fieldname] = true;
        }
        // If nonNull
        if (isNonNull) {
          localNonNullFields[fieldname] = true;
        }
        // If nonNull && Ubique
        if (isNonNull && isUnique) {
          localNonNullAndUniqueFields[fieldname] = true;
        }
      } else if (remoteApplicaitonValue) {
        remoteFieldsApplicationWise[remoteApplicaitonValue] =
          remoteFieldsApplicationWise[remoteApplicaitonValue] || {};
        remoteFieldsApplicationWise[remoteApplicaitonValue][fieldname] = true;

        // If isRelation
        if (isRelation) {
          const directiveName = directivesObject.relation.argument.name.value.value;
          const fieldType = parsedField.type.dataType;
          remoteRelationFields[fieldname] = {
            type: fieldType,
            relationName: directiveName,
          };
          relationFields[fieldname] = directiveName;
          remoteRelationFieldsApplicationWise[remoteApplicaitonValue] =
            remoteRelationFieldsApplicationWise[remoteApplicaitonValue] || {};
          remoteRelationFieldsApplicationWise[remoteApplicaitonValue][fieldname] = true;
        }
        // If isUnique
        if (isUnique) {
          remoteUniqueFieldsApplicationWise[remoteApplicaitonValue] =
            remoteUniqueFieldsApplicationWise[remoteApplicaitonValue] || {};
          remoteUniqueFieldsApplicationWise[remoteApplicaitonValue][fieldname] = true;
        }
        // If nonNull
        if (isNonNull) {
          remoteNonNullFieldsApplicationWise[remoteApplicaitonValue] =
            remoteNonNullFieldsApplicationWise[remoteApplicaitonValue] || {};
          remoteNonNullFieldsApplicationWise[remoteApplicaitonValue][fieldname] = true;
        }
        // If nonNull && Unique
        if (isNonNull && isUnique) {
          remoteNonNullAndUniqueFieldsApplicationWise[remoteApplicaitonValue] =
            remoteNonNullAndUniqueFieldsApplicationWise[remoteApplicaitonValue] || {};
          remoteNonNullAndUniqueFieldsApplicationWise[remoteApplicaitonValue][fieldname] = true;
        }
      }
      parsedField.directive = directivesObject; // this is object of directives.

      fieldsObject[fieldname] = parsedField;
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
