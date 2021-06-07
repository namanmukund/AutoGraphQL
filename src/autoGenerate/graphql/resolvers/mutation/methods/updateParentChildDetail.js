import { ifAuthorized, toObject } from '../../../../../../utils';
import { prehook } from '../../../preHook';
import { posthook } from '../../../postHook';
import updateParentChildDetailMutationResolver from '../user/updateParentChildDetailMutationResolver';

const updateParentChildDetail = async (root, params, context, info) => {
  const { parsedASTMap } = context;
  const authentication = ifAuthorized(context);
  const typeName = 'User';
  const mutationName = 'updateParentChildDetail';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  const newParams = params;
  newParams.input = hookInput;

  return updateParentChildDetailMutationResolver(
    root,
    params,
    context,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    authentication,
  ).then((result) => {
    const newResult = toObject(result);
    posthook(newResult, mutationName, context, params);
    return newResult;
  });
};

export default updateParentChildDetail;
