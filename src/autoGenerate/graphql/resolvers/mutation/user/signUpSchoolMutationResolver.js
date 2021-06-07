import { get } from 'lodash';
import {
  DatabaseRecordNotFoundError,
  UserAlreadyExistsError,
} from '../../../../../../constants/errors';
import { MutationController, QueryController } from '../../../controllers';
import { generateCuid } from '../../../../../../utils';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import localSignUpMutationPromise from '../utils/localSignUpMutationPromise';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import { ADD } from '../../../../../../constants/graphqlOperations';
import { commonUserValidation } from '../../../preHookFunctions/validation/utils';
import getUserFromDBQuery from './utils/getUserFromDBQuery';
import { SCHOOL_ADMIN } from '../../../../../../constants/roles';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const checkIfSchoolExist = async (schoolId) => {
  const query = `
query{
  school(id:"${schoolId}"){
    id
  }
}
  `;
  const res = await callLocalGraphqlApi(query);
  if (!get(res, 'data.school.id')) {
    throw new DatabaseRecordNotFoundError();
  }
  return true;
};

const updateSchoolQuery = async (schoolId, userId) => {
  const query = `
mutation{
  updateSchool(id:"${schoolId}", adminsConnectIds:["${userId}"]){
    id
  }
}
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.school.id');
};

const signUpSchoolMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) => {
  const { input, schoolId } = params;
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

  // const currentUser = authentication && authentication.user;
  //
  // if (currentUser) {
  //   throw new UserTokenNotRequiredError();
  // }
  // Object.assign(authentication, {
  //   user: true,
  // });

  const { name, email, phone } = input;
  commonUserValidation({ name, email, phone });
  await checkIfSchoolExist(schoolId);

  const modelQueries = new QueryController('User', authentication);
  const userData = await getUserFromDBQuery(input, modelQueries);
  /* if password is already present or if password
    is not present and also user is not socially logged in
    */
  if (userData && userData.id) {
    throw new UserAlreadyExistsError();
  }

  const cuidInput = generateCuid(input);
  const modelMutations = new MutationController(typeName, authentication);

  cuidInput.role = SCHOOL_ADMIN;
  const result = await localSignUpMutationPromise(
    cuidInput,
    modelMutations,
  );
  // update schoolInfo
  await updateSchoolQuery(schoolId, result.id);
  // return user with token
  return createUserTokenTypeData(result, authentication, '', true);
};

export default signUpSchoolMutationResolver;
