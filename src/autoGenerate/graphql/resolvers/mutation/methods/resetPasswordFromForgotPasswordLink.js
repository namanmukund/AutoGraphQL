import { ifAuthorized, toObject } from '../../../../../../utils';
import { resetPasswordFromForgotPasswordLinkMutationResolver } from '../index';

const resetPasswordFromForgotPasswordLink = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'resetPasswordFromForgotPasswordLink';

  return resetPasswordFromForgotPasswordLinkMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
    context,
  ).then((result) => toObject(result));
};

export default resetPasswordFromForgotPasswordLink;
