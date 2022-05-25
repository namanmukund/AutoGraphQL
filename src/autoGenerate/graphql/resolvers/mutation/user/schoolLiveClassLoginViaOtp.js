/* eslint-disable */
import { get } from 'lodash';
import getChildrenToken from './utils/getChildrenToken';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import { QueryController } from '../../../controllers';
import { getUserFromDBQuery } from './utils';
import { InvalidUserIdError, UserTokenNotRequiredError } from '../../../../../../constants/errors/auth';

const USER_TYPE = 'User';

const schoolLiveClassLoginViaOtp = async (
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
  const currentUser = authentication && authentication.user;
  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }
  if (!get(input, 'userId') && !get(input, 'buddyLoginInput', []).length) {
    throw new InvalidUserIdError()
  }
  Object.assign(authentication, {
    bypass: true,
  });
  const userModalQuery = new QueryController(USER_TYPE, authentication);
  if (get(input, 'userId')) {
    const userData = await getUserFromDBQuery({ id: get(input, 'userId') }, userModalQuery);
    const userTokenData = createUserTokenTypeData(userData, authentication);
    // if user is a parent then get children tokens as well
    if (get(userData, 'role') === 'parent') {
      userTokenData.children = await getChildrenToken(context, studentId);
    }
    return userTokenData;
  }
  if (get(input, 'buddyLoginInput', []).length) {
    let userTokenData = { buddyDetails: [] }
    for (let user of get(input, 'buddyLoginInput', [])) {
      const userData = await getUserFromDBQuery({ id: get(user, 'userId') }, userModalQuery);
      const userDetail = createUserTokenTypeData(userData, authentication);
      if (get(user, 'isPrimaryUser')) {
        userTokenData.buddyDetails.push({ ...userDetail, isPrimaryUser: true })
        userTokenData = { ...userTokenData, ...userDetail }
      } else {
        userTokenData.buddyDetails.push({ ...userDetail, isPrimaryUser: false })
      }
    }
    return userTokenData;
  }
};
export default schoolLiveClassLoginViaOtp;
