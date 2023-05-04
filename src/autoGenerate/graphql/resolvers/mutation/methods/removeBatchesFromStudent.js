import { prehook } from '../../../preHook';
import { toObject } from '../../../../../../utils';
import removeBatchesFromStudentMutationResolver from '../userData/removeBatchesFromStudent';

const removeBatchesFromStudent = async (root, params, context, info) => {
  const typeName = 'RemoveBatchesFromStudentStatus';
  const mutationName = 'removeBatchesFromStudent';
  const { parsedASTMap } = context;

  const hookInput = await prehook(params, mutationName, context, params);
  return removeBatchesFromStudentMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default removeBatchesFromStudent;
