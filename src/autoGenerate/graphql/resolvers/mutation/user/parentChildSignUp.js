import { get } from 'lodash';
import { getFieldsBeingFetched } from '../../../../utils';
import { isValidPhoneNumber, validate, validateName } from '../../../validation';
import { ADD } from '../../../../../../constants/graphqlOperations';
import {
  ChildAlreadyRegisteredError,
  EmailOrPhoneMismatchError,
  InvalidEmailError,
  InvalidPhoneError, SomethingWentWrongError, UserAlreadyExistsError,
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
  return result;
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

const getParentInfo = async (context, email, phone) => {
  const result = {};
  const { countryCode, number } = phone;
  const childrenName = [];
  const childrenToken = [];
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
          role
        }
      }
    }
  }
}
  `;
  const res = get(await callLocalGraphqlApi(query, context), 'data.users', []);
  // when same users are added with email and number separately
  if (res && res.length) {
    if (res.length > 1) {
      throw new UserAlreadyExistsError();
    }
    // if res has length 1 then check if phone and email belogs to the same user
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
      throw new EmailOrPhoneMismatchError();
    }

    if (parentProfile && parentProfile.id) {
      result.parentProfileId = parentProfile.id;
      const { children } = parentProfile;
      if (children && children.length) {
        children.forEach((child) => {
          const { user: { name } } = child;
          childrenName.push(name);
          childrenToken.push(createUserTokenTypeData(child.user));
        });
      }
    }
  }
  result.childrenName = childrenName;
  result.childrenToken = childrenToken;
  return result;
};
/*
- both the parent and a kid is registered
- email & phone both are required
- to add a sibling both phone and email of a parent should match
- user is returned with the kid's token as a role mentee
- two profiles are also created and mapped with each other
*/
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
  let parentId;
  let parentProfileId;
  Object.assign(authentication, {
    bypass: true,
  });
  // if parent exist don't add parent and check if the child exists too
  if (parentInfo && parentInfo.parentId) {
    parentId = parentInfo.parentId;
    parentProfileId = parentInfo.parentProfileId;
    const { childrenName } = parentInfo;
    if (childrenName && childrenName.length && childrenName.includes(childName)) {
      throw new ChildAlreadyRegisteredError();
    }
  } else {
    const parentData = {
      name: parentName,
      email: parentEmail,
      phone: parentPhone,
      role: PARENT,
    };
    const parentDataWithId = generateCuid(parentData);
    const parentUserData = await addUserData(authentication, parentDataWithId);

    if (!parentUserData || !parentUserData.id) {
      throw new SomethingWentWrongError({
        data: {
          message: 'parentId not found',
        },
      });
    }
    parentId = parentUserData.id;
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
  const childData = {
    name: childName,
    role: MENTEE,
  };
  const childDataWithId = generateCuid(childData);

  const childUserData = await addUserData(authentication, childDataWithId);
  const { id: childId } = childUserData;
  if (!childId) {
    throw new SomethingWentWrongError({
      data: {
        message: 'childId not found',
      },
    });
  }
  const studentProfileInputData = {};
  if (grade) {
    studentProfileInputData.grade = grade;
  }
  const studentProfileInput = {
    input: studentProfileInputData,
  };
  const studentProfileId = await addStudentProfile(context, studentProfileInput, childId, parentProfileId);
  if (!studentProfileId) {
    throw new SomethingWentWrongError({
      data: {
        message: 'studentProfileId not found',
      },
    });
  }
  // add parentProfile
  if (!parentProfileId) {
    throw new SomethingWentWrongError({
      data: {
        message: 'parentProfileId not found',
      },
    });
  }
  const queryController = new QueryController(USER_TYPE, authentication);
  const parentUserData = await queryController.fetchOne({ id: parentId });
  // generate parent token
  const userTokenData = createUserTokenTypeData(parentUserData, authentication, '', true);
  // generate kids token
  userTokenData.children = [
    ...parentInfo.childrenToken,
    createUserTokenTypeData(childUserData, authentication, '', true),
  ];
  return userTokenData;
};

export default parentChildSignUpMutationResolver;
