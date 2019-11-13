// return a user with its token
import createToken from '../../../../../auth/createToken';
import { toObject } from '../../../../../../utils';

const createUserTokenTypeData = (savedUser, authentication, toPhone) => {
  const token = createToken(savedUser, authentication, toPhone);

  const userTokenData = {
    ...toObject(savedUser),
    token,
  };
  return userTokenData;
};
export { createUserTokenTypeData };
