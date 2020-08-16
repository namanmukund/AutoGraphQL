import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { sendForgotPasswordLinkMutationResolver } from '../index';

const sendForgotPasswordLink = async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'sendForgotPasswordLink';

  const hookInput = await prehook(params, mutationName, context, params);

  return sendForgotPasswordLinkMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => toObject(result));
};

export default sendForgotPasswordLink;
