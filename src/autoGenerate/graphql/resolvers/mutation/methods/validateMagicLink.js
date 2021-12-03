import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { validateMagicLinkMutationResolver } from '../index';

const validateMagicLink = (async (root, params, context, info) => {
  const authentication = ifAuthorized(context);
  const { parsedASTMap } = context;
  const typeName = 'User';
  const mutationName = 'validateMagicLink';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return validateMagicLinkMutationResolver(
    root,
    params,
    context,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => toObject(result));
});

export default validateMagicLink;
