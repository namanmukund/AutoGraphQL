import { get } from 'lodash';
import { getFieldsBeingFetched } from '../../../../utils';
import { isValidPhoneNumber, validate, validateName } from '../../../validation';
import { ADD } from '../../../../../../constants/graphqlOperations';
import {
  InvalidEmailError,
  InvalidPhoneError, UnknownUserError, UserAlreadyExistsError,
  UserTokenNotRequiredError,
} from '../../../../../../constants/errors';
import isValidEmail from '../../../validation/isValidEmail';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MENTEE, PARENT } from '../../../../../../constants/roles';
import { generateCuid } from '../../../../../../utils';
import localSignUpMutationPromise from '../utils/localSignUpMutationPromise';
import { MutationController, QueryController } from '../../../controllers';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';

const USER_TYPE = 'User';
const validateParentChildSignUpInput = (input) => {
  const {
    parentName, childName, parentEmail, parentPhone,
  } = input;
  // check email
  if (!isValidEmail(parentEmail)) {
    throw new InvalidEmailError();
  }
  // check phone number
  if (!isValidPhoneNumber(parentPhone)) {
    throw new InvalidPhoneError();
  }
  // check childName
  validateName(childName);
  // check parentName
  validateName(parentName);

  return true;
};

const addUserData = async (authentication, dataWithId) => {
  const modelMutations = new MutationController(USER_TYPE, authentication);
  const result = await localSignUpMutationPromise(
    dataWithId,
    modelMutations,
  );
  return get(result, 'id');
};

const addStudentProfile = async (context, variables, userConnectId, parentProfileId) => {
  const query = `
mutation($input: StudentProfileInput!){
  addStudentProfile(input:$input, userConnectId: "${userConnectId}", parentsConnectIds:["${parentProfileId}"]){
    id
  }
}
`;

  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.addStudentProfile.id');
};

const addParentProfile = async (context, parentId, variables) => {
  const query = `
mutation($input: ParentProfileInput!){
  addParentProfile(userConnectId:"${parentId}", input:$input ){
    id
  }
}
  `;
  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.addParentProfile.id');
};
const ifEmailExists = async (email) => {
  const query = `query{
  usersMeta(filter:{
    email: "${email}"
  }){
    count
  }
}`;
  const res = get(await callLocalGraphqlApi(query), 'data.usersMeta.count');
  return res !== 0;
};

const getParentInfo = async (context, email, phone) => {
  const result = {};
  const { countryCode, number } = phone;
  const query = `
  query {
    users(filter:{
      or:[
      {email:"${email}"}
      {and:[
        {phone_countryCode_subDoc:"${countryCode}"}
        {phone_number_subDoc: "${number}"}
      ]}
      ]
    }){
      id
      name
      email
      phone {
      countryCode
      number
      }
      parentProfile {
        id
        children {
        id 
        user{
          id
          name
        }
      }
    }
  }
}
  `;
  const res = get(await callLocalGraphqlApi(query, context), 'data.users');
  console.log('res', res);
  if (res && res.length) {
    if (res.length > 1) {
      throw new UserAlreadyExistsError();
    }
    // if res has length 1
    const {
      id, parentProfile, email: parentEmail, phone: parentPhone,
    } = res[0];
    result.parentId = id;
    result.parentEmail = parentEmail;
    // only continue if parent phone and email are same to add a sibling
    if (
      parentPhone.countryCode !== countryCode
      || parentPhone.number !== number
      || parentEmail !== email
    ) {
      throw new UserAlreadyExistsError();
    }

    if (parentProfile && parentProfile.id) {
      result.parentProfileId = parentProfile.id;
      const { children } = parentProfile;
      const childrenNames = [];
      if (children && children.length) {
        children.forEach((child) => {
          const { user: { name } } = child;
          childrenNames.push(name);
        });
      }
      result.childrenNames = childrenNames;
    }
  }
  console.log('result', result);
  return result;
};

const parentChildSignUpMutationResolver = async (
  root,
  params,
  context,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) => {
  const { input } = params;
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  validate(
    'UserToken',
    ast,
    ADD,
    fieldsFetched,
    authentication,
    {},
  );

  const currentUser = authentication && authentication.user;

  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }
  validateParentChildSignUpInput(input);

  const {
    parentName, childName, parentEmail, parentPhone, grade, hasLaptopOrDesktop,
  } = input;

  // check if parent exist in db
  const parentInfo = await getParentInfo(context, parentEmail, parentPhone);
  console.log(parentInfo, parentInfo);
  let parentId;
  let parentProfileId;
  Object.assign(authentication, {
    bypass: true,
  });
  // if parent exist don't add parent and check if the child exists too
  if (parentInfo && parentInfo.parentId) {
    parentId = parentInfo.parentId;
    parentProfileId = parentInfo.parentProfileId;
    const { childrenNames } = parentInfo;
    if (childrenNames && childrenNames.length && childrenNames.includes(childName)) {
      throw new UserAlreadyExistsError();
    }
  } else {
    const parentData = {
      name: parentName,
      email: parentEmail,
      phone: parentPhone,
      role: PARENT,
    };
    const parentDataWithId = generateCuid(parentData);
    parentId = await addUserData(authentication, parentDataWithId);
    if (!parentId) {
      throw Error('Some error');
    }
  }
  if (!parentProfileId) {
    const parentProfileInputData = {};
    if (hasLaptopOrDesktop) {
      parentProfileInputData.hasLaptopOrDesktop = hasLaptopOrDesktop;
    }
    const variables = {
      input: parentProfileInputData,
    };
    parentProfileId = await addParentProfile(
      context,
      parentId,
      variables,
    );
  }
  console.log('parentId', parentId);
  const childData = {
    name: childName,
    role: MENTEE,
  };
  const childDataWithId = generateCuid(childData);

  const childId = await addUserData(authentication, childDataWithId);
  console.log('childId', childId);
  if (!childId) {
    throw Error('Some error child id');
  }
  const studentProfileInputData = {};
  if (grade) {
    studentProfileInputData.grade = grade;
  }
  const studentProfileInput = {
    input: studentProfileInputData,
  };
  const studentProfileId = await addStudentProfile(context, studentProfileInput, childId, parentProfileId);
  console.log('studentProfileId', studentProfileId);
  if (!studentProfileId) {
    throw Error('Some error studentProfileId');
  }
  // add parentProfile
  console.log('parentProfileId', parentProfileId);
  if (!parentProfileId) {
    throw new UnknownUserError;
  }
  const queryController = new QueryController(USER_TYPE, authentication);
  const childUserData = await queryController.fetchOne({ id: childId });
  return createUserTokenTypeData(childUserData);
};

export default parentChildSignUpMutationResolver;
