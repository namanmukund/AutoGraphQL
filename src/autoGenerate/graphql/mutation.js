/* file for autogenerating mutations from schema types */
import pluralize from 'pluralize';
import { trimEnd, includes, camelCase } from 'lodash';
import getParsedASTMap from '../utils/getParsedASTMap';
import getRelationMutationNames from '../utils/getRelationMutationNames';
import { types } from '../../../utils';
import {
  forceUpdateTypeNames,
  forceDeleteTypeNames,
} from '../../../constants';
import findFieldWithTheRelation from '../utils/findFieldWithTheRelation';
import validateFieldToAddForConnectMutationGeneration from '../utils/validateFieldToAddForConnectMutationGeneration';
import hasDirective from '../utils/hasDirective';
import getMutationNames from '../utils/getMutationNames';
import getDirectiveArgumentValue from '../utils/getDirectiveArgumentValue';
import getNestedConnectMutationString from '../utils/getNestedConnectMutationString';
import {
  ADD, DELETE, DELETE_MULTIPLE, UPDATE, UPDATE_MULTIPLE,
} from '../../../constants/graphqlOperations';

const parsedASTMap = getParsedASTMap(types);

const relationsAddedInMutation = [];
let mutationString = 'type Mutation{';
// array for relation names for whom mutation already made
const relationTypes = [];
const getRelationPayloadName = (relationName) => `${relationName}Payload`;

/* Check if the fieldName is present in the modal or not */
const hasField = (
  typeName,
  fieldName,
) => {
  // checking whether the field is present in the model
  if (parsedASTMap[typeName].field[fieldName]) {
    return true;
  }
  return false;
};
/* This function is checking if the condition that code field is present in
the modal then adding the code argument for that else making its id argument mandatory */
const toAddCodeField = (
  fieldName,
  typeName,
  condition,
) => {
  if (condition) {
    return `, ${fieldName}${typeName}Code: String`;
  }
  return '!';
};

/* Create the string of addto and remove from based on whether the field is present
or not */

const getAdditionalRelationFieldsIfPresent = (field, type) => {
  const additionalRelationFields = getDirectiveArgumentValue(
    parsedASTMap,
    type,
    field,
    'relation',
    'fields',
  );
  if (!additionalRelationFields) {
    return null;
  }
  return additionalRelationFields;
};

const appendToadditionalRelationFieldsArgumentsString = (
  fieldName,
  typeName,
  argumentString,
  relatedField,
  relatedType,
) => {
  const relationName = getDirectiveArgumentValue(
    parsedASTMap,
    relatedType,
    fieldName,
    'relation',
    'name',
  );
  let additionalRelationFieldsArgumentString = argumentString;
  additionalRelationFieldsArgumentString += `, ${fieldName}${typeName}Fields: ${relatedType}_${relationName}Input`;
  return additionalRelationFieldsArgumentString;
};

const getAdditionalRelationFieldsArguments = (
  fieldName,
  relatedTypeField,
  typeName,
  relatedType,
) => {
  let additionalRelationFieldsArgumentsString = '';
  const additionalRelationFields = getAdditionalRelationFieldsIfPresent(
    fieldName,
    typeName,
  );
  const additionalRelationFieldsInRelatedField = getAdditionalRelationFieldsIfPresent(
    relatedTypeField,
    relatedType,
  );
  if (!additionalRelationFields && !additionalRelationFieldsInRelatedField) {
    return null;
  }
  // append additional field arguments
  if (additionalRelationFields) {
    // send field and the type of field in arguments
    additionalRelationFieldsArgumentsString = appendToadditionalRelationFieldsArgumentsString(
      fieldName,
      relatedType,
      additionalRelationFieldsArgumentsString,
      relatedTypeField,
      typeName,
    );
  }
  // append related additional fields
  if (additionalRelationFieldsInRelatedField) {
    additionalRelationFieldsArgumentsString = appendToadditionalRelationFieldsArgumentsString(
      relatedTypeField,
      typeName,
      additionalRelationFieldsArgumentsString,
      fieldName,
      relatedType,
    );
  }
  return additionalRelationFieldsArgumentsString;
};

const nestedAddToRemoveFromMutationString = (
  addRelationMutationName,
  removeRelationMutationName,
  relatedTypeField = '',
  typeName,
  fieldName = '',
  relatedType,
  relationPayload,
  fieldNameToBeChecked,
  saveHistoryArgument,
) => {
  if (relatedType.includes('History')) {
    return '';
  }
  const typeNameString = camelCase(typeName);
  const relatedTypeString = camelCase(relatedType);
  /* If the field is present in the modal and related modal also */
  const typeNameHasCodeField = hasField(
    typeName,
    fieldNameToBeChecked,
  );
  const relatedTypeHasCodeField = hasField(
    relatedType,
    fieldNameToBeChecked,
  );
  let additionalRelationFieldsArguments = getAdditionalRelationFieldsArguments(
    fieldName,
    relatedTypeField,
    typeName,
    relatedType,
  );
  additionalRelationFieldsArguments = additionalRelationFieldsArguments || '';
  let string;
  string = `${addRelationMutationName} (${typeNameString}Id: ID${toAddCodeField(relatedTypeField, typeNameString, typeNameHasCodeField)}, ${relatedTypeString}Id: ID${toAddCodeField(fieldName, relatedTypeString, relatedTypeHasCodeField)} ${additionalRelationFieldsArguments} ${saveHistoryArgument}):${relationPayload}, `;
  string += `${removeRelationMutationName} (${typeNameString}Id: ID${toAddCodeField(relatedTypeField, typeNameString, typeNameHasCodeField)}, ${relatedTypeString}Id: ID${toAddCodeField(fieldName, relatedTypeString, relatedTypeHasCodeField)} ${saveHistoryArgument}):${relationPayload}, `;
  return string;
};

// make graphql types for connect mutations,
// payload is used when multiple types are appended in one type(for connect mutations)
const makeRelationTypePayload = (
  typeName,
  relatedType,
  relationPayload,
) => {
  // make camel case for mobile app
  const typeNameString = camelCase(typeName);
  const relatedTypeString = camelCase(relatedType);
  return `type ${relationPayload}{
     typeName: String,
    ${typeNameString}: ${typeName},
    fieldName: String,
    connectedTypeName: String,
    ${relatedTypeString}: ${relatedType},
     connectedFieldName: String
  }`;
};

Object.keys(parsedASTMap).forEach((type) => {
  const definition = parsedASTMap[type];
  const {
    name, field, directives, allowedOperations,
  } = definition;
  const typeName = name.value;
  const isModel = directives && hasDirective(directives, 'model');
  if (isModel) {
    const modelInputTypeName = `${typeName}Input`;
    const modelUpdateTypeName = `${typeName}Update`;
    const pluralTypeName = pluralize(typeName);
    const modelUpdateAllTypeName = `${pluralTypeName}Update`;
    const isVersionModelToBeMade = hasDirective(directives, 'history');
    // add save history arg for models where history is to be made
    let saveHistoryArgumentString = '';
    if (isVersionModelToBeMade) {
      saveHistoryArgumentString = ', history: HistoryInput';
    }
    const mutationNames = getMutationNames(typeName);
    // get relation fields
    const { relationFields } = definition;

    const nestedConnectMutationString = getNestedConnectMutationString(
      relationFields,
      type,
      parsedASTMap,
    );
    // add relation mutations
    const addModelMutationName = mutationNames.addMutation;
    const updateModelMutationName = mutationNames.updateMutation;
    const updateMultipleModelMutationName = mutationNames.updateMultipleMutation;
    const deleteModelMutationName = mutationNames.deleteMutation;
    const { deleteMultipleMutation } = mutationNames;
    let forceUpdate = '';
    if (forceUpdateTypeNames.includes(typeName)) {
      forceUpdate = ',force: Boolean';
    }
    let forceDelete = '';
    if (forceDeleteTypeNames.includes(typeName)) {
      forceDelete = ',force: Boolean';
    }
    // add operation
    if (
      (allowedOperations && allowedOperations === '*')
        || (allowedOperations && allowedOperations !== '*'
            && allowedOperations.length && allowedOperations.includes(ADD))
    ) {
      mutationString += `${addModelMutationName} ( input: ${modelInputTypeName}!,${nestedConnectMutationString}): ${typeName},`;
    }

    // update operation
    if (
      (allowedOperations && allowedOperations === '*')
        || (allowedOperations && allowedOperations !== '*'
            && allowedOperations.length && allowedOperations.includes(UPDATE))
    ) {
      mutationString += `${updateModelMutationName} (id: ID!, input: ${modelUpdateTypeName},${nestedConnectMutationString} ${saveHistoryArgumentString} ${forceUpdate}) : ${typeName},`;
    }

    // updateMultiple operation
    if (
      (allowedOperations && allowedOperations === '*')
        || (allowedOperations && allowedOperations !== '*'
            && allowedOperations.length && allowedOperations.includes(UPDATE_MULTIPLE))
    ) {
      mutationString += `${updateMultipleModelMutationName} (input: [${modelUpdateAllTypeName}]!) : [${typeName}],`;
    }

    // delete operation
    if (
      (allowedOperations && allowedOperations === '*')
        || (allowedOperations && allowedOperations !== '*'
            && allowedOperations.length && allowedOperations.includes(DELETE))
    ) {
      mutationString += `${deleteModelMutationName} (id: ID!, ${forceDelete}) : ${typeName},`;
    }

    // deleteMultiple operation
    if (
      (allowedOperations && allowedOperations === '*')
        || (allowedOperations && allowedOperations !== '*'
            && allowedOperations.length && allowedOperations.includes(DELETE_MULTIPLE))
    ) {
      mutationString += `${deleteMultipleMutation} (filter: ${typeName}Filter!, last: Int, first:Int, skip:Int, after: ID, before:ID) : [${typeName}],`;
    }

    // add relations connect mutations for all relations in the type
    Object.keys(relationFields).forEach((fieldName) => {
      const relationName = relationFields[fieldName];
      // if mutation for relation already added then skip
      if (includes(relationsAddedInMutation, relationName)) {
        return null;
      }

      const relatedType = field[fieldName].type.dataType;

      // get related type's related Field
      const relatedTypeField = findFieldWithTheRelation(
        relatedType,
        relationName,
        parsedASTMap,
        fieldName,
      );
      const isFieldValid = validateFieldToAddForConnectMutationGeneration(
        fieldName,
        relatedTypeField,
      );
      if (!isFieldValid) {
        return null;
      }

      const relationMutationNames = getRelationMutationNames(relationName);
      const addRelationMutationName = relationMutationNames.addToRelationMutation;
      const removeRelationMutationName = relationMutationNames.removeFromRelationMutation;
      // graphql type which has both the related types
      const relationPayload = getRelationPayloadName(relationName);
      const relationType = makeRelationTypePayload(
        typeName,
        relatedType,
        relationPayload,
      );
      // push type to relation types array
      relationTypes.push(relationType);
      // check that the field code is present in the modal and its related modal
      mutationString += nestedAddToRemoveFromMutationString(
        addRelationMutationName,
        removeRelationMutationName,
        relatedTypeField,
        typeName,
        fieldName,
        relatedType,
        relationPayload,
        'code',
        saveHistoryArgumentString,
      );
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
mutationString += 'socialLogin ( input: SocialLoginInput ): UserToken,';
mutationString += 'signupExistingUser ( input: ExistingUserInput, stopOtpTrigger:Boolean ): UserToken,';
mutationString += 'validateUserOTP ( id: ID!, phoneOtp: Int, emailOtp: Int ): User,';
mutationString += 'resendUserOTP ( id: ID!): User,';
mutationString += 'sendForgotPasswordOTP (input: PhoneInput, email: String): BooleanResult,';
mutationString += 'resendForgotPasswordOTP (input: PhoneInput, email: String): BooleanResult,';
mutationString += 'validateForgotPasswordOTP (input: PhoneInput, phoneOtp: Int, email: String, emailOtp: Int): BooleanResult,';
mutationString += 'finishForgotPassword (input: PhoneInput, phoneOtp: Int, email: String, emailOtp: Int, newPassword: String!): BooleanResult,';
mutationString += 'sendForgotPasswordLink (email: String!): BooleanResult,';
mutationString += 'resetPasswordFromForgotPasswordLink (newPassword: String!): BooleanResult,';
mutationString += 'userCourseSyllabus : UserCourseSyllabus,';
mutationString += 'userTopicJourney ( topicId: ID!): UserTopicJourney,';
mutationString += 'userFirstAndLatestQuizReport ( topicId: ID!): UserFirstAndLatestQuizReport,';
mutationString += 'skipVideo ( topicId: ID!): SkipVideo,';
mutationString += 'skipPracticeQuestion ( learningObjectiveId: ID!): BooleanResult,';
mutationString += 'userBadge : UserBadge,';
mutationString += 'getUnlockedUserBadge ( input: GetUnlockedUserBadgeInput ): GetUnlockedUserBadgeResult,';
// Backend Token only password update mutation
mutationString += 'tcirtSdrowssaPtes ( id: ID!, password: String! ): User,';
mutationString += 'uploadFile (fileInput: FileInput, connectInput: FileConnectInput): File! ,';

mutationString = trimEnd(mutationString, ',');
mutationString += '}';
const mutation = mutationString;

export { mutation, relationTypes };
