// return a user with its token
import createToken from '../../../../../auth/createToken';
import { toObject } from '../../../../../../utils';

const createUserTokenTypeData = (savedUser, authentication, toPhone, isSignUp = false) => {
  const token = createToken(savedUser, authentication, toPhone, '', isSignUp);

  const userTokenData = {
    ...toObject(savedUser),
    token,
  };
  return userTokenData;
};
export { createUserTokenTypeData };
