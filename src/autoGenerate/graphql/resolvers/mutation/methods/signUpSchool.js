import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { getPhoneOTP } from '../../../../../sms';
import { posthook } from '../../../postHook';
import signUpSchoolMutationResolver from '../user/signUpSchoolMutationResolver';

const signUpSchool = async (root, params, context, info) => {
  const { parsedASTMap } = context;
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'signUpSchool';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);
  const newParams = params;
  newParams.input = getPhoneOTP(hookInput);

  return signUpSchoolMutationResolver(
    root,
    newParams,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => {
    const newResult = toObject(result);
    return posthook(newResult, mutationName);
  });
};

export default signUpSchool;
