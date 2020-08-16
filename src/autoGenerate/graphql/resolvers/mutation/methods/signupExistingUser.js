import { getRandomNumber, ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { rangeOTP } from '../../../../../../constants';
import { signupExistingUserMutationResolver } from '../index';

const signupExistingUser = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  const typeName = 'User';
  const mutationName = 'signupExistingUser';
  const { input } = params;
  const { email } = input;
  const hookInput = await prehook(input, mutationName, context, params);
  const newParams = params;
  // existing user can signup through either email or phone
  const userOtp = getRandomNumber(rangeOTP.min, rangeOTP.max);
  if (email) {
    hookInput.emailOtp = userOtp;
  } else {
    hookInput.phoneOtp = userOtp;
  }
  newParams.input = hookInput;

  return signupExistingUserMutationResolver(
    root,
    newParams,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => toObject(result));
};

export default signupExistingUser;
