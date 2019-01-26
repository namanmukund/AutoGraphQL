/* file for autogenerating mutations from schema types */
import pluralize from 'pluralize';
import { trimEnd, includes, camelCase } from 'lodash';
import getParsedASTMap from '../utils/getParsedASTMap';
import getRelationMutationNames from '../utils/getRelationMutationNames';
import { types } from '../../../utils';
import {
  connectMutationsArgumentsSuffix,
  forceUpdateTypeNames,
  forceDeleteTypeNames,
  historyFieldName,
} from '../../../constants';
import findFieldWithTheRelation from '../utils/findFieldWithTheRelation';
import validateFieldToAddForConnectMutationGeneration from '../utils/validateFieldToAddForConnectMutationGeneration';
import hasDirective from '../utils/hasDirective';
import getMutationNames from '../utils/getMutationNames';
import getDirectiveArgumentValue from '../utils/getDirectiveArgumentValue';

const parsedASTMap = getParsedASTMap(types);

const relationsAddedInMutation = [];
let mutationString = 'type Mutation{';
// array for relation names for whom mutation already made
const relationTypes = [];
const getRelationPayloadName = relationName => `${relationName}Payload`;

/* Check if the fieldName is present in the modal or not */
const hasField = (typeName, fieldName) => {
  // checking whether the field is present in the model
  if (parsedASTMap[typeName].field[fieldName]) {
    return true;
  }
  return false;
};
/* This function is checking if the condition that code field is present in
the modal then adding the code argument for that else making its id argument mandatory */
const toAddCodeField = (fieldName, typeName, condition) => {
  if (condition) {
    return `, ${fieldName}${typeName}Code: String`;
  }
  return '!';
};

/* Create the string of addto and remove from based on whether the field is present
or not */

const getAdditionalRelationFieldsIfPresent = (field, type) => {
  const additionalRelationFields = getDirectiveArgumentValue(parsedASTMap, type, field, 'relation', 'fields');
  if (!additionalRelationFields) {
    return null;
  }
  return additionalRelationFields;
};

const appendToadditionalRelationFieldsArgumentsString = (fieldName, typeName,
  argumentString, relatedField, relatedType) => {
  const relationName = getDirectiveArgumentValue(parsedASTMap, relatedType,
    fieldName, 'relation', 'name');
  let additionalRelationFieldsArgumentString = argumentString;
  additionalRelationFieldsArgumentString += `, ${fieldName}${typeName}Fields: ${relatedType}_${relationName}Input`;
  return additionalRelationFieldsArgumentString;
};

const getAdditionalRelationFieldsArguments = (fieldName, relatedTypeField,
  typeName, relatedType) => {
  let additionalRelationFieldsArgumentsString = '';
  const additionalRelationFields = getAdditionalRelationFieldsIfPresent(fieldName, typeName);
  const additionalRelationFieldsInRelatedField = getAdditionalRelationFieldsIfPresent(
    relatedTypeField, relatedType);
  if (!additionalRelationFields && !additionalRelationFieldsInRelatedField) {
    return null;
  }
  // append additional field arguments
  if (additionalRelationFields) {
    // send field and the type of field in arguments
    additionalRelationFieldsArgumentsString = appendToadditionalRelationFieldsArgumentsString(
      fieldName, relatedType, additionalRelationFieldsArgumentsString, relatedTypeField,
      typeName);
  }
  // append related additional fields
  if (additionalRelationFieldsInRelatedField) {
    additionalRelationFieldsArgumentsString = appendToadditionalRelationFieldsArgumentsString(
      relatedTypeField, typeName, additionalRelationFieldsArgumentsString, fieldName,
      relatedType);
  }
  return additionalRelationFieldsArgumentsString;
};

const nestedAddToRemoveFromMutationString = (addRelationMutationName,
  removeRelationMutationName, relatedTypeField = '', typeName, fieldName = '', relatedType,
  relationPayload, fieldNameToBeChecked, saveHistoryArgument) => {
  if (relatedType.includes('History')) {
    return '';
  }
  let typeNameString = typeName;
  let relatedTypeString = relatedType;
  // if one way relation then string 'field' is added instead of the field name which wont be found
  if (relatedTypeField === '') {
    typeNameString = `field${typeNameString}`;
  }
  if (fieldName === '') {
    relatedTypeString = `field${relatedTypeString}`;
  }
  /* If the field is present in the modal and related modal also */
  const typeNameHasCodeField = hasField(typeName, fieldNameToBeChecked);
  const relatedTypeHasCodeField = hasField(relatedType, fieldNameToBeChecked);
  let additionalRelationFieldsArguments = getAdditionalRelationFieldsArguments(
    fieldName, relatedTypeField, typeName, relatedType);
  additionalRelationFieldsArguments = additionalRelationFieldsArguments || '';
  let string;
  string = `${addRelationMutationName} (${relatedTypeField}${typeNameString}Id: ID${toAddCodeField(relatedTypeField, typeNameString, typeNameHasCodeField)}, ${fieldName}${relatedTypeString}Id: ID${toAddCodeField(fieldName, relatedTypeString, relatedTypeHasCodeField)} ${additionalRelationFieldsArguments} ${saveHistoryArgument}):${relationPayload}, `;
  string += `${removeRelationMutationName} (${relatedTypeField}${typeNameString}Id: ID${toAddCodeField(relatedTypeField, typeNameString, typeNameHasCodeField)}, ${fieldName}${relatedTypeString}Id: ID${toAddCodeField(fieldName, relatedTypeString, relatedTypeHasCodeField)} ${saveHistoryArgument}):${relationPayload}, `;
  return string;
};

const getNestedConnectMutationString = (relationFields, type) => {
  let connectMutationString = '';
  Object.keys(relationFields).forEach((fieldName) => {
    if (fieldName === historyFieldName) {
      return;
    }
    // if field type is array
    if (parsedASTMap[type].field[fieldName].type.isList) {
      connectMutationString += `${fieldName}${connectMutationsArgumentsSuffix.plural} : [ID], `;
    } else {
      connectMutationString += `${fieldName}${connectMutationsArgumentsSuffix.singular} : ID, `;
    }
  });
  connectMutationString = trimEnd(connectMutationString, ',');
  return connectMutationString;
};
// make graphql types for connect mutations,
// payload is used when multiple types are appended in one type(for connect mutations)
const makeRelationTypePayload = (typeName, fieldName = '', relatedType,
  relatedTypeField = '', relationPayload) => {
  // make camel case for mobile app
  let typeNameString = typeName;
  let relatedTypeString = relatedType;
  if (relatedTypeField === '') {
    typeNameString = `field${typeNameString}`;
  }
  if (fieldName === '') {
    relatedTypeString = `field${relatedTypeString}`;
  }
  const relationType = `type ${relationPayload}{
    ${relatedTypeField}${typeNameString}: ${typeName},
    ${fieldName}${relatedTypeString}: ${relatedType}
  }`;
  return relationType;
};

Object.keys(parsedASTMap).forEach((type) => {
  const definition = parsedASTMap[type];
  const { name, field, directives } = definition;
  const typeName = name.value;

  const isModel = directives && hasDirective(directives, 'model');
  if (isModel) {
    const modelInputTypeName = `${typeName}Input`;
    const modelUpdateTypeName = `${typeName}Update`;
    const pluralTypeName = camelCase(pluralize(typeName));
    const modelUpdateAllTypeName = `${pluralTypeName}Update`;
    const isVersionModelToBeMade = hasDirective(directives, 'history');
    // add save history arg for models where history is to be made
    let saveHistoryArgumentString = '';
    if (isVersionModelToBeMade) {
      saveHistoryArgumentString = ', history: HistoryInput';
    }
    const mutationNames = getMutationNames(typeName);
    // get relation fields
    const relationFields = definition.relationFields;

    const nestedConnectMutationString = getNestedConnectMutationString(relationFields, type);
    // add relation mutations
    const addModelMutationName = mutationNames.addMutation;
    const updateModelMutationName = mutationNames.updateMutation;
    const updateMultipleModelMutationName = mutationNames.updateMultipleMutation;
    const deleteModelMutationName = mutationNames.deleteMutation;
    const deleteMultipleMutation = mutationNames.deleteMultipleMutation;
    let forceUpdate = '';
    if (forceUpdateTypeNames.includes(typeName)) {
      forceUpdate = ',force: Boolean';
    }
    let forceDelete = '';
    if (forceDeleteTypeNames.includes(typeName)) {
      forceDelete = ',force: Boolean';
    }
    mutationString += `${addModelMutationName} ( input: ${modelInputTypeName}!,${nestedConnectMutationString}): ${typeName},`;
    mutationString += `${updateModelMutationName} (id: ID!, input: ${modelUpdateTypeName},${nestedConnectMutationString} ${saveHistoryArgumentString} ${forceUpdate}) : ${typeName},`;
    mutationString += `${updateMultipleModelMutationName} (input: [${modelUpdateAllTypeName}], ${nestedConnectMutationString} ${saveHistoryArgumentString}) : [${typeName}],`;
    mutationString += `${deleteModelMutationName} (id: ID!, ${forceDelete}) : ${typeName},`;
    mutationString += `${deleteMultipleMutation} (filter: ${typeName}Filter!, last: Int, first:Int, skip:Int, after: ID, before:ID) : [${typeName}],`;

    // add relations connect mutations for all relations in the type
    Object.keys(relationFields).forEach((fieldName) => {
      const relationName = relationFields[fieldName];
      // if mutation for relation already added then skip
      if (includes(relationsAddedInMutation, relationName)) {
        return null;
      }

      const relatedType = field[fieldName].type.dataType;

      // get related type's related Field
      const relatedTypeField = findFieldWithTheRelation(relatedType, relationName,
        parsedASTMap, fieldName);
      const isFieldValid = validateFieldToAddForConnectMutationGeneration(fieldName,
        relatedTypeField);
      if (!isFieldValid) {
        return null;
      }

      const relationMutationNames = getRelationMutationNames(relationName);
      const addRelationMutationName = relationMutationNames.addToRelationMutation;
      const removeRelationMutationName = relationMutationNames.removeFromRelationMutation;
      // graphql type which has both the related types
      const relationPayload = getRelationPayloadName(relationName);
      const relationType = makeRelationTypePayload(typeName, fieldName, relatedType,
        relatedTypeField, relationPayload);
      // push type to relation types array
      relationTypes.push(relationType);
      // check that the field code is present in the modal and its related modal
      mutationString += nestedAddToRemoveFromMutationString(addRelationMutationName,
        removeRelationMutationName, relatedTypeField, typeName, fieldName, relatedType,
        relationPayload, 'code', saveHistoryArgumentString);
      // push relation name to array
      relationsAddedInMutation.push(relationName);
      return null;
    });
  }
});

mutationString += 'signUp ( input: SignUpInput ): UserToken,';
mutationString += 'setUserPassword ( id: ID!, password: String! ): User,';
mutationString += 'resetUserPassword ( id: ID!, oldPassword: String!, newPassword: String!  ): User,';
mutationString += 'login ( input: LoginInput ): UserToken,';
mutationString += 'signupExistingUser ( input: ExistingUserInput, stopOtpTrigger:Boolean ): UserToken,';
mutationString += 'validateUserOTP ( id: ID!, phoneOtp: Int, emailOtp: Int ): User,';
mutationString += 'resendUserOTP ( id: ID!): User,';
mutationString += 'sendForgotPasswordOTP (input: PhoneInput, email: String): BooleanResult,';
mutationString += 'resendForgotPasswordOTP (input: PhoneInput, email: String): BooleanResult,';
mutationString += 'validateForgotPasswordOTP (input: PhoneInput, phoneOtp: Int, email: String, emailOtp: Int): BooleanResult,';
mutationString += 'finishForgotPassword (input: PhoneInput, phoneOtp: Int, email: String, emailOtp: Int, newPassword: String!): BooleanResult,';

// Backend Token only password update mutation
mutationString += 'tcirtSdrowssaPtes ( id: ID!, password: String! ): User,';
mutationString += 'uploadFile (file: FileInput): File! ,';

mutationString = trimEnd(mutationString, ',');
mutationString += '}';
const mutation = mutationString;

export { mutation, relationTypes };
