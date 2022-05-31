/* eslint-disable */
import { get } from 'lodash';
import getChildrenToken from './utils/getChildrenToken';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import { QueryController } from '../../../controllers';
import { getUserFromDBQuery } from './utils';
import { InvalidUserIdError } from '../../../../../../constants/errors/auth';

const USER_TYPE = 'User';

const signupOrLoginViaOtp = async (
  root,
  params,
  context,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) => {
  const { input } = params
  if (!get(input, 'userId')) {
    throw new InvalidUserIdError()
  }
  Object.assign(authentication, {
    bypass: true,
  });
  const userModalQuery = new QueryController(USER_TYPE, authentication);
  const userData = await getUserFromDBQuery({ id: get(input, 'userId') }, userModalQuery);
  const userTokenData = createUserTokenTypeData(userData, authentication);
  // if user is a parent then get children tokens as well
  if (get(userData, 'role') === 'parent') {
    userTokenData.children = await getChildrenToken(context, studentId);
  }
  return userTokenData;
};
export default signupOrLoginViaOtp;
