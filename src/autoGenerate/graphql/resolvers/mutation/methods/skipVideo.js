import { prehook } from '../../../preHook';
import { skipVideoMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const skipVideo = async (root, params, context, info) => {
  const typeName = 'SkipVideo';
  const mutationName = 'skipVideo';
  const { parsedASTMap } = context;

  const hookInput = await prehook(params, mutationName, context, params);

  return skipVideoMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
    params,
  ).then((result) => toObject(result));
};

export default skipVideo;
